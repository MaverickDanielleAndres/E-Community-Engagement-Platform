import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSupabaseServerClient } from '@/lib/supabase'
import { messagingMiddleware } from '@/lib/messaging-middleware'
import { MessageCache } from '@/lib/message-cache'
import { z } from 'zod'

type MessageInsert = {
  conversation_id: string
  sender_id: string
  body: string
  type: string
  reply_to_message_id?: string
  metadata?: Record<string, unknown>
}

type MessageSelect = {
  id: string
  body: string
  type: string
  reply_to_message_id?: string
  created_at: string
  metadata?: Record<string, unknown>
  users: { id: string; name: string; image?: string } | null
}

type AuditLogInsert = {
  actor_id: string
  action: string
  target_table: string
  target_id: string
  payload: Record<string, unknown>
}

type MessageWithRelations = {
  id: string
  body: string
  type: string
  reply_to_message_id?: string
  deleted_at?: string
  created_at: string
  metadata?: Record<string, unknown>
  sender_id: string
  users: { id: string; name: string; image?: string } | null
  message_attachments: Array<{
    id: string
    storage_path: string
    file_name: string
    mime_type: string
    size_bytes: number
    thumbnail_path?: string
  }>
  message_reactions: Array<{
    id: string
    user_id: string
    reaction: string
    created_at: string
    users: { name: string } | null
  }>
  reply_to_message: {
    id: string
    body: string
    type: string
    sender_id: string
    users: { name: string } | null
  } | null
  message_reads: Array<{
    id: string
    user_id: string
    read_at: string
    users: { name: string } | null
  }>
}

const sendMessageSchema = z.object({
  body: z.string().max(2000).optional(),
  type: z.enum(['text', 'image', 'file', 'video', 'gif', 'voice']).default('text'),
  replyToMessageId: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return messagingMiddleware(request, async () => {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const conversationId = params.id
      const { searchParams } = new URL(request.url)
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100 messages per request
      const cursor = searchParams.get('cursor') // Cursor for pagination
      const direction = searchParams.get('direction') || 'newer' // 'older' or 'newer'

      const supabase = getSupabaseServerClient()

      // First, check if conversation exists
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .single()

      if (convError || !conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }

      // Then, verify user is participant in conversation
      const { data: participant, error: partError } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', session.user.id)
        .single()

      if (partError || !participant) {
        return NextResponse.json({ error: 'Not a participant in this conversation' }, { status: 403 })
      }

      // Build query with cursor-based pagination
      let query = supabase
        .from('messages')
        .select(`
          id,
          body,
          type,
          reply_to_message_id,
          deleted_at,
          created_at,
          metadata,
          sender_id,
          users!sender_id(id, name, image),
          message_attachments(id, storage_path, file_name, mime_type, size_bytes, thumbnail_path),
          message_reactions(id, user_id, reaction, created_at, users!user_id(name)),
          reply_to_message:reply_to_message_id(id, body, type, sender_id, users!sender_id(name)),
          message_reads(id, user_id, read_at, users!user_id(name))
        `)
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: direction === 'older' })
        .limit(limit)

      if (cursor) {
        if (direction === 'older') {
          query = query.lt('created_at', cursor)
        } else {
          query = query.gt('created_at', cursor)
        }
      }

      const { data: messages, error: msgError } = await query

      if (msgError) {
        console.error('Error fetching messages:', msgError)
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
      }

      // Generate signed URLs for attachments
      const formattedMessages = await Promise.all((messages as MessageWithRelations[])?.map(async (msg: MessageWithRelations) => {
        const attachmentsWithUrls = await Promise.all((msg.message_attachments || []).map(async (att) => {
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('message-media')
            .createSignedUrl(att.storage_path, 3600) // 1 hour expiry

          return {
            id: att.id,
            name: att.file_name,
            type: att.mime_type,
            size: att.size_bytes,
            url: signedUrlError ? null : signedUrlData.signedUrl
          }
        }))

        // Group reactions by emoji
        const reactionsMap = new Map<string, { emoji: string; count: number; users: string[] }>()
        msg.message_reactions?.forEach((r) => {
          const existing = reactionsMap.get(r.reaction)
          if (existing) {
            existing.count++
            existing.users.push(r.users?.name || 'Unknown')
          } else {
            reactionsMap.set(r.reaction, {
              emoji: r.reaction,
              count: 1,
              users: [r.users?.name || 'Unknown']
            })
          }
        })

        // Determine if message is read by current user
        const isRead = msg.message_reads && msg.message_reads.some((read: any) => read.user_id === session.user.id)

        // Get read by list
        const readBy = msg.message_reads?.map((read: any) => ({
          userId: read.user_id,
          userName: read.users?.name || 'Unknown',
          readAt: read.read_at
        })) || []

        return {
          id: msg.id,
          content: msg.body,
          senderId: msg.sender_id,
          senderName: msg.users?.name || '',
          timestamp: msg.created_at,
          attachments: attachmentsWithUrls,
          gif: msg.metadata?.gif || undefined,
          reactions: Array.from(reactionsMap.values()),
          replyTo: msg.reply_to_message ? {
            id: msg.reply_to_message.id,
            content: msg.reply_to_message.body,
            senderName: msg.reply_to_message.users?.name || ''
          } : undefined,
          isRead,
          readBy,
          isEdited: msg.metadata?.isEdited || false
        }
      })) || []

      // Cache the messages for future requests
      const cache = MessageCache.getInstance()
      if (!cursor) {
        // Only cache initial loads (no cursor)
        cache.setCachedMessages(conversationId, formattedMessages)
      }

      return NextResponse.json({ messages: formattedMessages })
  } catch (error) {
    console.error('Error in messages GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return messagingMiddleware(request, async () => {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const conversationId = params.id

      // Parse form data instead of JSON
      const formData = await request.formData()
      const messageBody = formData.get('content') as string | null
      const type = (formData.get('type') as string) || 'text'
      const replyToMessageId = formData.get('replyToMessageId') as string | null
      const metadataStr = formData.get('metadata') as string | null
      const gifStr = formData.get('gif') as string | null
      const attachments = formData.getAll('attachments') as File[]
      let metadata: Record<string, unknown> | undefined = undefined
      let gif: any = undefined
      let finalType = type

      // Validate file sizes (50MB limit)
      const maxFileSize = 50 * 1024 * 1024 // 50MB in bytes
      if (attachments.some(file => file.size > maxFileSize)) {
        return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 })
      }

      if (metadataStr) {
        try {
          metadata = JSON.parse(metadataStr)
        } catch (e) {
          console.error('Failed to parse metadata:', e)
        }
      }

      if (gifStr) {
        try {
          gif = JSON.parse(gifStr)
          finalType = 'gif' // Override type if gif is provided
        } catch (e) {
          console.error('Failed to parse gif:', e)
        }
      }

      // Check if message body, gif, or attachments are provided
      if ((!messageBody || typeof messageBody !== 'string' || messageBody.trim() === '') && !gif && attachments.length === 0) {
        return NextResponse.json({ error: 'Message content, gif, or attachments are required' }, { status: 400 })
      }

      // Validate the parsed data
      const validationResult = sendMessageSchema.safeParse({
        body: messageBody || undefined,
        type: finalType,
        replyToMessageId: replyToMessageId || undefined,
        metadata: metadata || undefined
      })

      if (!validationResult.success && !gif && attachments.length === 0) {
        return NextResponse.json({ error: 'Invalid request data', details: validationResult.error.errors }, { status: 400 })
      }

      const supabase = getSupabaseServerClient()

      // First, check if conversation exists
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .single()

      if (convError || !conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }

      // Then, verify user is participant in conversation
      const { data: participant, error: partError } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', session.user.id)
        .single()

      if (partError || !participant) {
        return NextResponse.json({ error: 'Not a participant in this conversation' }, { status: 403 })
      }

      // If replying to a message, verify it exists in this conversation
      if (replyToMessageId) {
        const { data: replyMsg, error: replyError } = await supabase
          .from('messages')
          .select('id')
          .eq('id', replyToMessageId)
          .eq('conversation_id', conversationId)
          .single()

        if (replyError || !replyMsg) {
          return NextResponse.json({ error: 'Reply message not found' }, { status: 404 })
        }
      }

      // Insert message
      const messageData: MessageInsert = {
        conversation_id: conversationId,
        sender_id: session.user.id,
        body: messageBody || '',
        type: finalType,
        reply_to_message_id: replyToMessageId || undefined,
        metadata: gif ? { gif } : metadata
      }

      const { data: message, error: msgError } = await (supabase as any)
        .from('messages')
        .insert(messageData)
        .select(`
          id,
          body,
          type,
          reply_to_message_id,
          created_at,
          metadata,
          users!sender_id(id, name, image)
        `)
        .single()

      if (msgError) {
        console.error('Error sending message:', msgError)
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
      }

      // Handle file attachments
      let attachmentRecords = []
      if (attachments.length > 0) {
        for (const file of attachments) {
          // Ensure file is a valid File object
          if (!file || !(file instanceof File) || !file.name || !file.type) {
            console.error('Invalid file object:', file)
            continue
          }

          const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin'
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
          const filePath = `${session.user.id}/${conversationId}/${(message as MessageSelect).id}/${fileName}`

          // Upload file to Supabase storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('message-media')
            .upload(filePath, file, {
              contentType: file.type,
              upsert: false
            })

          if (uploadError) {
            console.error('Error uploading file:', uploadError)
            console.error('File path attempted:', filePath)
            console.error('Bucket name:', 'message-media')
            continue // Skip this file but continue with others
          }

          // Create attachment record
          const { data: attachment, error: attachError } = await (supabase as any)
            .from('message_attachments')
            .insert({
              message_id: (message as MessageSelect).id,
              storage_path: filePath,
              file_name: file.name,
              mime_type: file.type,
              size_bytes: file.size
            })
            .select('id, storage_path, file_name, mime_type, size_bytes')
            .single()

          if (!attachError && attachment) {
            // Generate signed URL for immediate access
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('message-media')
              .createSignedUrl(filePath, 3600) // 1 hour expiry

            attachmentRecords.push({
              id: attachment.id,
              name: attachment.file_name,
              type: attachment.mime_type,
              size: attachment.size_bytes,
              url: signedUrlError ? null : signedUrlData.signedUrl
            })
          }
        }
      }

      // Log audit event
      const auditData: AuditLogInsert = {
        actor_id: session.user.id,
        action: 'send_message',
        target_table: 'messages',
        target_id: (message as MessageSelect).id,
        payload: { conversation_id: conversationId, type, attachment_count: attachments.length }
      }

      await (supabase as any).from('audit_logs').insert(auditData)

      // Format response
      const formattedMessage = {
        id: (message as MessageSelect).id,
        content: (message as MessageSelect).body,
        senderId: session.user.id,
        senderName: (message as MessageSelect).users?.name || '',
        timestamp: (message as MessageSelect).created_at,
        attachments: attachmentRecords,
        gif: gif || undefined,
        reactions: [],
        replyTo: undefined
      }

      // Add new message to cache
      const cache = MessageCache.getInstance()
      cache.addMessageToCache(conversationId, formattedMessage)

      return NextResponse.json({ message: formattedMessage }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
      }

      console.error('Error in messages POST:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
