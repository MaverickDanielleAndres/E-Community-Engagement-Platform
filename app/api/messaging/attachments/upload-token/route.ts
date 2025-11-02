import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSupabaseServerClient } from '@/lib/supabase'
import { messagingMiddleware } from '@/lib/messaging-middleware'
import { z } from 'zod'

type AuditLog = {
  actor_id: string
  action: string
  target_table: string
  target_id: string
  payload: Record<string, unknown>
  created_at?: string
}

const uploadTokenSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().min(1).max(20 * 1024 * 1024), // 20MB limit
  contentType: z.string().regex(/^[^/]+\/[^/]+$/),
  conversationId: z.string().uuid()
})

export async function POST(
  request: NextRequest
) {
  return messagingMiddleware(request, async () => {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

    const body = await request.json()
    const { fileName, fileSize, contentType, conversationId } = uploadTokenSchema.parse(body)

    const supabase = getSupabaseServerClient()

    // Verify user is participant in the conversation
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', session.user.id)
      .single()

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Access denied to conversation' }, { status: 403 })
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/quicktime', 'video/x-msvideo',
      'audio/mpeg', 'audio/wav', 'audio/ogg',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    // Generate unique file path
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || ''
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const filePath = `message-media/${conversationId}/${timestamp}_${randomId}.${fileExtension}`

    // Create signed upload URL
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('message-media')
      .createSignedUploadUrl(filePath, { upsert: false }) // 1 hour expiry

    if (uploadError) {
      console.error('Error creating upload URL:', uploadError)
      return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 })
    }

    // Log audit event
    const auditEntry: Omit<AuditLog, 'created_at'> = {
      actor_id: session.user.id,
      action: 'create_upload_token',
      target_table: 'message-media',
      target_id: filePath,
      payload: {
        file_name: fileName,
        file_size: fileSize,
        content_type: contentType,
        conversation_id: conversationId
      }
    }

    await (supabase as any).from('audit_logs').insert(auditEntry)

    return NextResponse.json({
      uploadUrl: uploadData.signedUrl,
      filePath: uploadData.path,
      token: uploadData.token
    }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
      }

      console.error('Error in upload token POST:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
