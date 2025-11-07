'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Search, Plus } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { useTheme } from '@/components/ThemeContext'

interface Conversation {
  id: string
  participants: Array<{
    id: string
    name: string
    avatar?: string
    online?: boolean
  }>
  lastMessage?: {
    content: string
    timestamp: string
    senderId: string
    isRead?: boolean
  }
  unreadCount: number
  typingUsers?: string[]
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedConversation: Conversation | null
  onSelectConversation: (conversation: Conversation) => void
  onNewConversation: () => void
  loading?: boolean
  currentUserId?: string
}

export function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  onNewConversation,
  loading = false,
  currentUserId
}: ConversationListProps) {
  const { isDark } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [conversationNames, setConversationNames] = useState<Record<string, string>>({})

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('conversationName_')) {
        const conversationId = e.key.replace('conversationName_', '')
        setConversationNames(prev => ({
          ...prev,
          [conversationId]: e.newValue || ''
        }))
      }
    }

    // Load initial names
    const initialNames: Record<string, string> = {}
    conversations.forEach(conv => {
      const storedName = localStorage.getItem(`conversationName_${conv.id}`)
      if (storedName) {
        initialNames[conv.id] = storedName
      }
    })
    setConversationNames(initialNames)

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [conversations])

  const filteredConversations = conversations.filter(conv =>
    conv.participants.some(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  return (
    <div className="w-80 border-r border-slate-200 dark:border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            Messages
          </h1>
          <button
            onClick={onNewConversation}
            className={`p-2 rounded-lg transition-colors hover:bg-${isDark ? 'white/10' : 'slate-100'}`}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Users}
              title="No conversations yet"
              description="Start a conversation with a community member"
            />
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <motion.div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation)}
              className={`p-4 border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors ${
                selectedConversation?.id === conversation.id
                  ? `${isDark ? 'bg-slate-800 hover:bg-slate-900' : 'bg-blue-50 hover:bg-slate-50'}`
                  : `${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative">
                  {conversation.participants.length === 2 && currentUserId ? (
                    (() => {
                      const otherParticipant = conversation.participants.find(p => p.id !== currentUserId)
                      return otherParticipant?.avatar ? (
                        <img
                          src={otherParticipant.avatar}
                          alt={otherParticipant.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-700 font-medium text-sm">
                            {otherParticipant?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )
                    })()
                  ) : (
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-700" />
                    </div>
                  )}

                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">
                      {conversationNames[conversation.id] ||
                        (conversation.participants.length === 2 && currentUserId
                          ? conversation.participants.find(p => p.id !== currentUserId)?.name || conversation.participants.map(p => p.name).join(', ')
                          : conversation.participants.map(p => p.name).join(', '))}
                    </p>

                  </div>

                  {/* Last message and typing indicator */}
                  <div className="mt-1">
                    {conversation.typingUsers && conversation.typingUsers.length > 0 ? (
                      <p className="text-xs text-blue-500 italic">
                        {conversation.typingUsers.length === 1
                          ? `${conversation.typingUsers[0]} is typing...`
                          : `${conversation.typingUsers.slice(0, 2).join(', ')} are typing...`
                        }
                      </p>
                    ) : conversation.lastMessage ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {conversation.lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                        No messages yet
                      </p>
                    )}
                  </div>


                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
