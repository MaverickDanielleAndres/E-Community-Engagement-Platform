import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// In-memory cache for messages (in production, use Redis or similar)
const messageCache = new Map<string, { data: any[], timestamp: number, ttl: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export interface CachedMessage {
  id: string
  content: string
  senderId: string
  senderName: string
  timestamp: string
  attachments?: Array<{
    id: string
    name: string
    type: string
    url: string | null
  }>
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
}

export class MessageCache {
  private static instance: MessageCache

  static getInstance(): MessageCache {
    if (!MessageCache.instance) {
      MessageCache.instance = new MessageCache()
    }
    return MessageCache.instance
  }

  // Get cached messages for a conversation
  getCachedMessages(conversationId: string): CachedMessage[] | null {
    const cached = messageCache.get(conversationId)
    if (!cached) return null

    // Check if cache is expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      messageCache.delete(conversationId)
      return null
    }

    return cached.data
  }

  // Set cached messages for a conversation
  setCachedMessages(conversationId: string, messages: CachedMessage[], ttl = CACHE_TTL): void {
    messageCache.set(conversationId, {
      data: messages,
      timestamp: Date.now(),
      ttl
    })
  }

  // Invalidate cache for a conversation
  invalidateConversation(conversationId: string): void {
    messageCache.delete(conversationId)
  }

  // Update cache with new message
  addMessageToCache(conversationId: string, message: CachedMessage): void {
    const cached = messageCache.get(conversationId)
    if (cached) {
      cached.data.unshift(message) // Add to beginning for newest first
      cached.timestamp = Date.now() // Refresh timestamp
    }
  }

  // Update cache with message reaction
  updateMessageReaction(conversationId: string, messageId: string, userId: string, reaction: string, action: 'add' | 'remove', newReaction?: any): void {
    const cached = messageCache.get(conversationId)
    if (cached) {
      const messageIndex = cached.data.findIndex(msg => msg.id === messageId)
      if (messageIndex !== -1) {
        const message = cached.data[messageIndex]

        if (action === 'remove') {
          // Remove the reaction
          message.reactions = message.reactions.filter((r: any) => !(r.reaction === reaction && r.userId === userId))
        } else if (action === 'add' && newReaction) {
          // Add new reaction
          message.reactions.push(newReaction)
        }

        cached.timestamp = Date.now() // Refresh timestamp
      }
    }
  }

  // Clean up expired cache entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, value] of messageCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        messageCache.delete(key)
      }
    }
  }
}

// Start cleanup interval
setInterval(() => {
  MessageCache.getInstance().cleanup()
}, 60000) // Clean up every minute

export default MessageCache
