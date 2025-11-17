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

    // Get sender role for real-time messages
    const { data: allMembers } = await supabase
      .from('community_members')
      .select('user_id, role')

    const roleMap = new Map((allMembers as any)?.map((m: any) => [m.user_id, m.role]) || [])
    const senderRole = roleMap.get(msg.senderId) || 'member'

    return {
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      senderName: msg.senderName || '',
      timestamp: msg.timestamp,
      attachments: attachmentsWithUrls,
      gif: msg.gif || undefined,
      reactions: Array.from(reactionsMap.values()),
      replyTo: msg.replyTo ? {
        id: msg.replyTo.id,
        content: msg.replyTo.content,
        senderName: msg.replyTo.senderName || ''
      } : undefined,
      isEdited: msg.isEdited || false,
      role: senderRole
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

    // Broadcast channel for messages, reactions and refresh
    const broadcastChannel = supabase
      .channel(`messages_${conversationId}`)
      .on('broadcast', { event: 'message_insert' }, async (payload) => {
        console.log('Message insert broadcast:', payload)
        if (payload.payload.conversationId === conversationId) {
          // Format the message properly for real-time updates
          const formattedMessage = await formatMessageForRealtime(payload.payload.message)
          onMessageInsert(formattedMessage)
        }
      })
      .on('broadcast', { event: 'reaction_change' }, (payload) => {
        console.log('Reaction change broadcast:', payload)
        onReactionChange()
      })
      .on('broadcast', { event: 'refresh_messages' }, (payload) => {
        console.log('Refresh messages broadcast:', payload)
        if (payload.payload.conversationId === conversationId) {
          onRefresh()
        }
      })
      .on('broadcast', { event: 'refresh' }, (payload) => {
        console.log('Refresh broadcast:', payload)
        if (payload.payload.conversationId === conversationId) {
          onRefresh()
        }
      })
      .subscribe()

    channelsRef.current = [broadcastChannel]

    return cleanup
  }, [session?.user?.id, conversationId, onMessageInsert, onMessageUpdate, onMessageDelete, onReactionChange, onRefresh, supabase])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [])
}
