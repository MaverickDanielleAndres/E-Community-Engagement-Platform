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

interface Message {
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
  readBy?: string[]
  isOptimistic?: boolean
  isEdited?: boolean
}

interface TypingIndicator {
  userId: string
  userName: string
  conversationId: string
  timestamp: number
}

interface UseMessagingReturn {
  conversations: Conversation[]
  selectedConversation: Conversation | null
  messages: Message[]
  typingIndicators: TypingIndicator[]
  isLoading: boolean
  error: string | null

  // Actions
  selectConversation: (conversation: Conversation | null) => void
  sendMessage: (content: string, attachments?: Attachment[], replyTo?: { id: string; content: string; senderName: string }, gif?: any) => Promise<void>
  markMessageAsRead: (messageId: string) => Promise<void>
  addReaction: (messageId: string, emoji: string) => Promise<void>
  removeReaction: (messageId: string, emoji: string) => Promise<void>
  startTyping: () => void
  stopTyping: () => void
  createConversation: (participantIds: string[]) => Promise<Conversation | null>
  deleteMessage: (messageId: string) => Promise<void>
  editMessage: (messageId: string, newContent: string) => Promise<void>
  deleteConversation: (conversationId: string) => Promise<void>

  // Real-time status
  onlineUsers: Set<string>
  refreshMessages: () => Promise<void>
}

export function useMessaging(): UseMessagingReturn {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [typingIndicators, setTypingIndicators] = useState<TypingIndicator[]>([])
  const [isLoading, setIsLoading] = useState(true)
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

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/messaging/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      } else {
        setError('Failed to fetch conversations')
      }
    } catch (err) {
      setError('Error fetching conversations')
      console.error('Error fetching conversations:', err)
    }
  }, [session?.user?.id])

  // Fetch messages for selected conversation with pagination
  const fetchMessages = useCallback(async (conversationId: string, cursor?: string, direction: 'older' | 'newer' = 'older') => {
    try {
      const params = new URLSearchParams()
      if (cursor) params.set('cursor', cursor)
      params.set('direction', direction)
      params.set('limit', '50')

      const response = await fetch(`/api/messaging/conversations/${conversationId}/messages?${params}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(prev => {
          if (cursor) {
            if (direction === 'newer') {
              // Prepend newer messages
              return [...data.messages, ...prev]
            } else {
              // Append older messages
              return [...prev, ...data.messages]
            }
          } else {
            // No cursor, replace all messages
            return data.messages
          }
        })
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
    if (selectedConversation) {
      await fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation, fetchMessages])

  // Set up real-time subscriptions
  const setupRealtimeSubscriptions = useCallback(() => {
    if (!session?.user?.id) return

    cleanup()

    // Messages subscription
    const messagesChannel = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=in.(${conversations.map(c => c.id).join(',') || 'null'})`
      }, async (payload) => {
        console.log('Message change:', payload)
        if (payload.eventType === 'INSERT' && selectedConversation) {
          // Only update if the new message is for the selected conversation
          if (payload.new.conversation_id === selectedConversation.id) {
            // Fetch the complete message with relations directly
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
                // Format the message to match the expected structure
                const formattedMessage = await formatMessageForRealtime(newMessage)
                setMessages(prev => [...prev, formattedMessage])
              }
            } catch (err) {
              console.error('Error fetching new message:', err)
              // Fallback to fetching all messages
              fetchMessages(selectedConversation.id)
            }
          }
          fetchConversations()
        } else if (payload.eventType === 'UPDATE' && selectedConversation) {
          // Handle message edits
          if (payload.new.conversation_id === selectedConversation.id) {
            setMessages(prev => prev.map(msg =>
              msg.id === payload.new.id ? {
                ...msg,
                content: payload.new.body,
                isEdited: true
              } : msg
            ))
          }
        } else if (payload.eventType === 'DELETE' && selectedConversation) {
          // Handle message deletions
          if (payload.old.conversation_id === selectedConversation.id) {
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id))
          }
        }
      })
      .subscribe()

    // Refresh channel for real-time updates
    const refreshChannel = supabase
      .channel('refresh')
      .on('broadcast', { event: 'refresh' }, (payload) => {
        if (payload.payload.conversationId === selectedConversation?.id) {
          // Automatically refresh messages when changes are detected
          refreshMessages()
        }
      })
      .subscribe()

    // Message reactions subscription
    const reactionsChannel = supabase
      .channel('message_reactions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_reactions'
      }, (payload) => {
        console.log('Reaction change:', payload)
        // Refetch messages to get updated reactions
        if (selectedConversation) {
          fetchMessages(selectedConversation.id)
        }
      })
      .subscribe()

    // Conversations subscription
    const conversationsChannel = supabase
      .channel('conversations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations'
      }, (payload) => {
        console.log('Conversation change:', payload)
        fetchConversations()
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
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
        setOnlineUsers(prev => new Set([...prev, key]))
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
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
      .channel('typing')
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.conversationId === selectedConversation?.id) {
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

    channelsRef.current = [messagesChannel, refreshChannel, reactionsChannel, conversationsChannel, presenceChannel, typingChannel]
  }, [session?.user?.id, conversations, selectedConversation, fetchMessages, fetchConversations, cleanup, formatMessageForRealtime, refreshMessages])

  // Clean up typing indicators after 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingIndicators(prev =>
        prev.filter(t => Date.now() - t.timestamp < 3000)
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Initialize
  useEffect(() => {
    if (session?.user?.id) {
      fetchConversations()
      setIsLoading(false)
    }
  }, [session?.user?.id, fetchConversations])

  // Set up subscriptions when conversations change
  useEffect(() => {
    if (conversations.length > 0) {
      setupRealtimeSubscriptions()
    }

    return cleanup
  }, [conversations, setupRealtimeSubscriptions, cleanup])

  // Select conversation
  const selectConversation = useCallback((conversation: Conversation | null) => {
    setSelectedConversation(conversation)
    if (conversation) {
      fetchMessages(conversation.id)
    } else {
      setMessages([])
    }
  }, [fetchMessages])

  // Send message with optimistic updates
  const sendMessage = useCallback(async (content: string, attachments?: Attachment[], replyTo?: { id: string; content: string; senderName: string }, gif?: any) => {
    if (!selectedConversation || (!content.trim() && attachments?.length === 0 && !gif)) return

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
        url: '' // Don't create object URL for temp attachments
      })),
      gif,
      replyTo,
      isOptimistic: true
    }

    // Add optimistic message
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

      const response = await fetch(`/api/messaging/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        // Remove optimistic message and fetch real messages
        setMessages(prev => prev.filter(msg => msg.id !== tempId))
        fetchMessages(selectedConversation.id)
        fetchConversations()

        // Broadcast refresh event to other users in the conversation
        supabase.channel('refresh').send({
          type: 'broadcast',
          event: 'refresh',
          payload: {
            conversationId: selectedConversation.id
          }
        })
      } else {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempId))
        setError('Failed to send message')
      }
    } catch (err) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      setError('Error sending message')
      console.error('Error sending message:', err)
    }
  }, [selectedConversation, session?.user, fetchMessages, fetchConversations])

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
        fetchConversations() // Update unread counts
      }
    } catch (err) {
      console.error('Error marking message as read:', err)
    }
  }, [fetchConversations])

  // Add reaction
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/messaging/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction: emoji })
      })

      if (response.ok) {
        fetchMessages(selectedConversation?.id || '')
      }
    } catch (err) {
      console.error('Error adding reaction:', err)
    }
  }, [selectedConversation?.id, fetchMessages])

  // Remove reaction (same endpoint handles toggle)
  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/messaging/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction: emoji })
      })

      if (response.ok) {
        fetchMessages(selectedConversation?.id || '')
      }
    } catch (err) {
      console.error('Error removing reaction:', err)
    }
  }, [selectedConversation?.id, fetchMessages])

  // Typing indicators
  const startTyping = useCallback(() => {
    if (!selectedConversation) return

    supabase.channel('typing').send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: session?.user?.id,
        userName: session?.user?.name,
        conversationId: selectedConversation.id
      }
    })

    // Auto-stop typing after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, 3000)
  }, [selectedConversation, session?.user])

  const stopTyping = useCallback(() => {
    if (!selectedConversation) return

    supabase.channel('typing').send({
      type: 'broadcast',
      event: 'stop_typing',
      payload: {
        userId: session?.user?.id,
        conversationId: selectedConversation.id
      }
    })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }, [selectedConversation, session?.user])

  // Create conversation
  const createConversation = useCallback(async (participantIds: string[]): Promise<Conversation | null> => {
    try {
      const response = await fetch('/api/messaging/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantIds })
      })

      if (response.ok) {
        const data = await response.json()
        fetchConversations()
        return data.conversation
      }
    } catch (err) {
      console.error('Error creating conversation:', err)
    }
    return null
  }, [fetchConversations])

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const response = await fetch(`/api/messaging/messages/${messageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId))
        fetchConversations()
      }
    } catch (err) {
      console.error('Error deleting message:', err)
    }
  }, [fetchConversations])

  // Edit message
  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    console.log('Edit message:', messageId, newContent)
    try {
      const response = await fetch(`/api/messaging/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent })
      })

      console.log('Edit response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Edit response data:', data)
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, content: data.data.body, isEdited: true } : msg
        ))
        fetchConversations()
      } else {
        const errorData = await response.json()
        console.error('Edit failed:', errorData)
      }
    } catch (err) {
      console.error('Error editing message:', err)
    }
  }, [fetchConversations])

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messaging/conversations/${conversationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setConversations(prev => prev.filter(conv => conv.id !== conversationId))
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(null)
          setMessages([])
        }
      }
    } catch (err) {
      console.error('Error deleting conversation:', err)
    }
  }, [selectedConversation])

  // Real-time subscriptions
  useEffect(() => {
    if (!session?.user?.id || !selectedConversation?.id) return

    const channel = supabase
      .channel(`conversation_${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`
        },
        (payload: any) => {
          console.log('Message change detected:', payload)

          if (payload.eventType === 'INSERT') {
            // New message added
            const newMessage = {
              id: payload.new.id,
              content: payload.new.body,
              senderId: payload.new.sender_id,
              senderName: payload.new.users?.name || 'Unknown',
              timestamp: payload.new.created_at,
              attachments: payload.new.message_attachments?.map((att: any) => ({
                id: att.id,
                name: att.file_name,
                type: att.mime_type,
                size: att.size_bytes,
                url: att.thumbnail_path || null
              })) || [],
              reactions: payload.new.message_reactions?.map((reaction: any) => ({
                emoji: reaction.reaction,
                count: 1,
                users: [reaction.users?.name || 'Unknown']
              })) || [],
              replyTo: payload.new.reply_to_message ? {
                id: payload.new.reply_to_message.id,
                content: payload.new.reply_to_message.body,
                senderName: payload.new.reply_to_message.users?.name || 'Unknown'
              } : undefined,
              isRead: false,
              readBy: []
            }

            setMessages(prev => {
              // Check if message already exists (avoid duplicates)
              if (prev.some(msg => msg.id === newMessage.id)) {
                return prev
              }
              return [...prev, newMessage]
            })

            // Update conversation last message if it's a new message
            if (payload.new.sender_id !== session.user.id) {
              fetchConversations()
            }
          } else if (payload.eventType === 'UPDATE') {
            // Message updated (edited)
            setMessages(prev => prev.map(msg =>
              msg.id === payload.new.id
                ? { ...msg, content: payload.new.body, isEdited: true }
                : msg
            ))
          } else if (payload.eventType === 'DELETE') {
            // Message deleted
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id))
            fetchConversations()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `conversation_id=eq.${selectedConversation.id}`
        },
        (payload: any) => {
          console.log('Reaction change detected:', payload)

          // Update message reactions
          setMessages(prev => prev.map(msg => {
            if (msg.id === payload.new?.message_id || msg.id === payload.old?.message_id) {
              // Re-fetch reactions for this message
              fetchMessages(selectedConversation.id)
            }
            return msg
          }))
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reads',
          filter: `conversation_id=eq.${selectedConversation.id}`
        },
        (payload: any) => {
          console.log('Read status change detected:', payload)

          // Update read status
          setMessages(prev => prev.map(msg => {
            if (msg.id === payload.new?.message_id) {
              return {
                ...msg,
                isRead: true,
                readBy: [...(msg.readBy || []), payload.new.user_id]
              }
            }
            return msg
          }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.user?.id, selectedConversation?.id, supabase, fetchMessages, fetchConversations])



  return {
    conversations,
    selectedConversation,
    messages,
    typingIndicators,
    isLoading,
    error,
    selectConversation,
    sendMessage,
    markMessageAsRead,
    addReaction,
    removeReaction,
    startTyping,
    stopTyping,
    createConversation,
    deleteMessage,
    editMessage,
    deleteConversation,
    onlineUsers,
    refreshMessages
  }
}
