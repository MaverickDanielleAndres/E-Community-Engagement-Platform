'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { getSupabaseClient } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Message } from './useAdminMessaging'

interface UseRealtimeConversationProps {
  conversationId: string | null
  onMessageInsert: (message: Message) => void
  onMessageUpdate: (messageId: string, updates: Partial<Message>) => void
  onMessageDelete: (messageId: string) => void
  onReactionChange: () => void
  onRefresh: () => void
}

export function useRealtimeConversation({
  conversationId,
  onMessageInsert,
  onMessageUpdate,
  onMessageDelete,
  onReactionChange,
  onRefresh
}: UseRealtimeConversationProps) {
  const { data: session } = useSession()
  const supabase = getSupabaseClient()
  const channelsRef = useRef<RealtimeChannel[]>([])

  // Helper function to format message for real-time updates
  const formatMessageForRealtime = async (msg: any): Promise<Message> => {
    const attachmentsWithUrls = await Promise.all((msg.message_attachments || []).map(async (att: any) => {
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
    msg.message_reactions?.forEach((r: any) => {
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
      isEdited: msg.metadata?.isEdited || false
    }
  }

  // Cleanup function
  const cleanup = () => {
    channelsRef.current.forEach(channel => channel.unsubscribe())
    channelsRef.current = []
  }

  useEffect(() => {
    if (!session?.user?.id || !conversationId) {
      cleanup()
      return
    }

    cleanup()

    // Messages subscription
    const messagesChannel = supabase
      .channel(`messages_${conversationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, async (payload) => {
        console.log('Real-time message change:', payload)
        if (payload.eventType === 'INSERT') {
          try {
            const { data: newMessage, error } = await supabase
              .from('messages')
              .select(`
                id,
                body,
                type,
                reply_to_message_id,
                created_at,
                metadata,
                sender_id,
                users!sender_id(id, name, image),
                message_attachments(id, storage_path, file_name, mime_type, size_bytes, thumbnail_path),
                message_reactions(id, user_id, reaction, created_at, users!user_id(name)),
                reply_to_message:reply_to_message_id(id, body, type, sender_id, users!sender_id(name))
              `)
              .eq('id', payload.new.id)
              .single()

            if (!error && newMessage) {
              const formattedMessage = await formatMessageForRealtime(newMessage)
              onMessageInsert(formattedMessage)
            }
          } catch (err) {
            console.error('Error fetching new message:', err)
            onRefresh() // Fallback to refresh
          }
        } else if (payload.eventType === 'UPDATE') {
          onMessageUpdate(payload.new.id, {
            content: payload.new.body,
            isEdited: true
          })
        } else if (payload.eventType === 'DELETE') {
          onMessageDelete(payload.old.id)
        }
      })
      .subscribe()

    // Message reactions subscription
    const reactionsChannel = supabase
      .channel(`reactions_${conversationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_reactions',
        filter: `conversation_id=eq.${conversationId}`
      }, () => {
        console.log('Real-time reaction change')
        onReactionChange()
      })
      .subscribe()

    // Refresh broadcast channel for cross-interface updates
    const refreshChannel = supabase
      .channel('refresh')
      .on('broadcast', { event: 'refresh' }, (payload) => {
        console.log('Refresh broadcast received:', payload)
        if (payload.payload.conversationId === conversationId) {
          onRefresh()
        }
      })
      .subscribe()

    channelsRef.current = [messagesChannel, reactionsChannel, refreshChannel]

    return cleanup
  }, [session?.user?.id, conversationId, onMessageInsert, onMessageUpdate, onMessageDelete, onReactionChange, onRefresh, supabase])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [])
}
