'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { getSupabaseClient } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface Conversation {
  id: string
  participants: Array<{
    id: string
    name: string
    avatar?: string
    isOnline?: boolean
    lastSeen?: string
  }>
  lastMessage?: {
    content: string
    timestamp: string
    senderId: string
  }
  unreadCount: number
  createdAt: string
  updatedAt: string
}

interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url?: string
  file?: File
}

export interface Message {
  id: string
  content: string
  senderId: string
  senderName: string
  timestamp: string
  attachments?: Attachment[]
  gif?: {
    id: string
    title: string
    url: string
    preview: string
    width: number
    height: number
  }
  reactions?: Array<{
    emoji: string
    count: number
    users: string[]
  }>
  replyTo?: {
    id: string
    content: string
    senderName: string
  }
  isRead?: boolean
  readBy?: Array<{
    userId: string
    userName: string
    readAt: string
  }>
  isOptimistic?: boolean
  isEdited?: boolean
}

interface TypingIndicator {
  userId: string
  userName: string
  conversationId: string
  timestamp: number
}

interface UseAdminMessagingReturn {
  conversation: Conversation | null
  messages: Message[]
  typingIndicators: TypingIndicator[]
  isLoading: boolean
  error: string | null

  // Actions
  initializeConversation: (memberId: string) => Promise<void>
  sendMessage: (content: string, attachments?: Attachment[], replyTo?: { id: string; content: string; senderName: string }, gif?: any) => Promise<void>
  markMessageAsRead: (messageId: string) => Promise<void>
  addReaction: (messageId: string, emoji: string) => Promise<void>
  removeReaction: (messageId: string, emoji: string) => Promise<void>
  startTyping: () => void
  stopTyping: () => void
  deleteMessage: (messageId: string) => Promise<void>
  editMessage: (messageId: string, newContent: string) => Promise<void>

  // Real-time status
  onlineUsers: Set<string>
  refreshMessages: () => Promise<void>
  clearConversation: () => void
}

export function useAdminMessaging(): UseAdminMessagingReturn {
  const { data: session } = useSession()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [typingIndicators, setTypingIndicators] = useState<TypingIndicator[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

  const supabase = getSupabaseClient()
  const channelsRef = useRef<RealtimeChannel[]>([])
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Helper function to format message for real-time updates
  const formatMessageForRealtime = useCallback(async (msg: any): Promise<Message> => {
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
  }, [supabase])

  // Cleanup function
  const cleanup = useCallback(() => {
    channelsRef.current.forEach(channel => channel.unsubscribe())
    channelsRef.current = []
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }, [])

  // Fetch messages for the current conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messaging/conversations/${conversationId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      } else {
        setError('Failed to fetch messages')
      }
    } catch (err) {
      setError('Error fetching messages')
      console.error('Error fetching messages:', err)
    }
  }, [])

  // Refresh messages
  const refreshMessages = useCallback(async () => {
    if (conversation) {
      await fetchMessages(conversation.id)
    }
  }, [conversation, fetchMessages])

  // Initialize conversation with a specific member
  const initializeConversation = useCallback(async (memberId: string) => {
    if (!session?.user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      // First, try to find existing conversation with this member
      const response = await fetch('/api/messaging/conversations')
      if (response.ok) {
        const data = await response.json()
        const existingConversation = data.conversations?.find((conv: Conversation) =>
          conv.participants.length === 2 &&
          conv.participants.some(p => p.id === memberId)
        )

        if (existingConversation) {
          setConversation(existingConversation)
          await fetchMessages(existingConversation.id)
          setupRealtimeSubscriptions(existingConversation.id)
          setIsLoading(false)
          return
        }
      }

      // If no existing conversation, create a new one
      const createResponse = await fetch('/api/messaging/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantIds: [memberId], isGroup: false })
      })

      if (createResponse.ok) {
        const createData = await createResponse.json()
        setConversation(createData.conversation)
        await fetchMessages(createData.conversation.id)
        setupRealtimeSubscriptions(createData.conversation.id)
      } else {
        setError('Failed to create conversation')
      }
    } catch (err) {
      setError('Error initializing conversation')
      console.error('Error initializing conversation:', err)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id, fetchMessages])

  // Set up real-time subscriptions for the current conversation
  const setupRealtimeSubscriptions = useCallback((conversationId: string) => {
    if (!session?.user?.id) return

    cleanup()

    // Messages subscription
    const messagesChannel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, async (payload) => {
        console.log('Admin message change:', payload)
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
              setMessages(prev => [...prev, formattedMessage])
            }
          } catch (err) {
            console.error('Error fetching new message:', err)
            fetchMessages(conversationId)
          }
        } else if (payload.eventType === 'UPDATE') {
          setMessages(prev => prev.map(msg =>
            msg.id === payload.new.id ? {
              ...msg,
              content: payload.new.body,
              isEdited: true
            } : msg
          ))
        } else if (payload.eventType === 'DELETE') {
          setMessages(prev => prev.filter(msg => msg.id !== payload.old.id))
        }
      })
      .subscribe()

    // Message reactions subscription
    const reactionsChannel = supabase
      .channel('message_reactions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_reactions',
        filter: `conversation_id=eq.${conversationId}`
      }, () => {
        fetchMessages(conversationId)
      })
      .subscribe()

    // Presence channel for online status
    const presenceChannel = supabase.channel('presence', {
      config: {
        presence: {
          key: session.user.id,
        },
      },
    })

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = presenceChannel.presenceState()
        const onlineUserIds = new Set<string>()
        Object.values(presenceState).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            onlineUserIds.add(presence.user_id)
          })
        })
        setOnlineUsers(onlineUserIds)
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => new Set([...prev, key]))
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(key)
          return newSet
        })
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: session.user.id,
            online_at: new Date().toISOString(),
          })
        }
      })

    // Typing indicators channel
    const typingChannel = supabase
      .channel(`admin_typing_${conversationId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.conversationId === conversationId) {
          setTypingIndicators(prev => {
            const existing = prev.find(t => t.userId === payload.payload.userId)
            if (existing) {
              return prev.map(t =>
                t.userId === payload.payload.userId
                  ? { ...t, timestamp: Date.now() }
                  : t
              )
            } else {
              return [...prev, {
                userId: payload.payload.userId,
                userName: payload.payload.userName,
                conversationId: payload.payload.conversationId,
                timestamp: Date.now()
              }]
            }
          })
        }
      })
      .on('broadcast', { event: 'stop_typing' }, (payload) => {
        setTypingIndicators(prev =>
          prev.filter(t => t.userId !== payload.payload.userId)
        )
      })
      .subscribe()

    channelsRef.current = [messagesChannel, reactionsChannel, presenceChannel, typingChannel]
  }, [session?.user?.id, fetchMessages, formatMessageForRealtime, cleanup])

  // Clean up typing indicators after 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingIndicators(prev =>
        prev.filter(t => Date.now() - t.timestamp < 3000)
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Send message
  const sendMessage = useCallback(async (content: string, attachments?: Attachment[], replyTo?: { id: string; content: string; senderName: string }, gif?: any) => {
    if (!conversation || (!content.trim() && attachments?.length === 0 && !gif)) return

    const tempId = `temp-${Date.now()}`
    const optimisticMessage: Message = {
      id: tempId,
      content: content || '',
      senderId: session?.user?.id || '',
      senderName: session?.user?.name || '',
      timestamp: new Date().toISOString(),
      attachments: attachments?.map(attachment => ({
        id: `temp-${attachment.name}`,
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
        url: ''
      })),
      gif,
      replyTo,
      isOptimistic: true
    }

    setMessages(prev => [...prev, optimisticMessage])

    try {
      const formData = new FormData()
      if (content) formData.append('content', content)
      attachments?.forEach(attachment => {
        if (attachment.file) {
          formData.append('attachments', attachment.file)
        }
      })
      if (replyTo) {
        formData.append('replyToMessageId', replyTo.id)
      }
      if (gif) {
        formData.append('gif', JSON.stringify(gif))
      }

      const response = await fetch(`/api/messaging/conversations/${conversation.id}/messages`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== tempId))
        fetchMessages(conversation.id)
      } else {
        setMessages(prev => prev.filter(msg => msg.id !== tempId))
        setError('Failed to send message')
      }
    } catch (err) {
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      setError('Error sending message')
      console.error('Error sending message:', err)
    }
  }, [conversation, session?.user, fetchMessages])

  // Mark message as read
  const markMessageAsRead = useCallback(async (messageId: string) => {
    try {
      const response = await fetch(`/api/messaging/messages/${messageId}/read`, {
        method: 'POST'
      })

      if (response.ok) {
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, isRead: true } : msg
        ))
      }
    } catch (err) {
      console.error('Error marking message as read:', err)
    }
  }, [])

  // Add reaction
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/messaging/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction: emoji })
      })

      if (response.ok) {
        fetchMessages(conversation?.id || '')
      }
    } catch (err) {
      console.error('Error adding reaction:', err)
    }
  }, [conversation?.id, fetchMessages])

  // Remove reaction
  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/messaging/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction: emoji })
      })

      if (response.ok) {
        fetchMessages(conversation?.id || '')
      }
    } catch (err) {
      console.error('Error removing reaction:', err)
    }
  }, [conversation?.id, fetchMessages])

  // Typing indicators
  const startTyping = useCallback(() => {
    if (!conversation) return

    supabase.channel(`admin_typing_${conversation.id}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: session?.user?.id,
        userName: session?.user?.name,
        conversationId: conversation.id
      }
    })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, 3000)
  }, [conversation, session?.user])

  const stopTyping = useCallback(() => {
    if (!conversation) return

    supabase.channel(`admin_typing_${conversation.id}`).send({
      type: 'broadcast',
      event: 'stop_typing',
      payload: {
        userId: session?.user?.id,
        conversationId: conversation.id
      }
    })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }, [conversation, session?.user])

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const response = await fetch(`/api/messaging/messages/${messageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId))
      }
    } catch (err) {
      console.error('Error deleting message:', err)
    }
  }, [])

  // Edit message
  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    try {
      const response = await fetch(`/api/messaging/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent })
      })

      if (response.ok) {
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, content: newContent, isEdited: true } : msg
        ))
      }
    } catch (err) {
      console.error('Error editing message:', err)
    }
  }, [])

  // Clear conversation (for when modal closes)
  const clearConversation = useCallback(() => {
    setConversation(null)
    setMessages([])
    setTypingIndicators([])
    cleanup()
  }, [cleanup])

  return {
    conversation,
    messages,
    typingIndicators,
    isLoading,
    error,
    initializeConversation,
    sendMessage,
    markMessageAsRead,
    addReaction,
    removeReaction,
    startTyping,
    stopTyping,
    deleteMessage,
    editMessage,
    onlineUsers,
    refreshMessages,
    clearConversation
  }
}
