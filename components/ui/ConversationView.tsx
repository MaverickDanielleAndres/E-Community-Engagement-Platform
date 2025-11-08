'use client'

import { useEffect, useRef, useState } from 'react'
import { Users, MoreVertical, RefreshCw, Menu } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { MessageItem } from '@/components/ui/MessageItem'
import { Composer } from '@/components/ui/Composer'

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
  }
  unreadCount: number
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
}

interface ConversationViewProps {
  conversation: Conversation | null
  messages: Message[]
  currentUserId: string
  onSendMessage: (content: string, attachments?: any[], gif?: any, replyTo?: { id: string; content: string; senderName: string }) => void
  onReaction: (messageId: string, emoji: string, action: 'add' | 'remove') => void
  onReply: (messageId: string, replyTo: Message) => void
  onDelete?: (messageId: string) => void
  onEdit?: (messageId: string, newContent: string) => void
  onRefreshMessages?: () => void
  loading?: boolean
  replyTo?: { id: string; content: string; senderName: string } | null
  isSidebarOpen?: boolean
  onToggleSidebar?: () => void
}

export function ConversationView({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  onReaction,
  onReply,
  onDelete,
  onEdit,
  onRefreshMessages,
  loading = false,
  replyTo: propReplyTo,
  isSidebarOpen = false
}: ConversationViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; senderName: string } | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    setReplyTo(propReplyTo || null)
  }, [propReplyTo])

  const handleReply = (messageId: string, replyToMessage: Message) => {
    setReplyTo({
      id: messageId,
      content: replyToMessage.content,
      senderName: replyToMessage.senderName
    })
    onReply(messageId, replyToMessage)
  }

  const handleCancelReply = () => {
    setReplyTo(null)
  }

  const handleToggleSidebar = () => {
    onToggleSidebar?.()
  }

  return (
    <div className="flex-1 flex flex-col">
      <ConversationHeader conversation={conversation} currentUserId={currentUserId} onRefreshMessages={onRefreshMessages} onToggleSidebar={handleToggleSidebar} />

      {!conversation ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={Users}
            title="Select a conversation"
            description="Choose a conversation from the list to start messaging"
          />
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-12rem)] scroll-smooth">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <EmptyState
                  icon={Users}
                  title="No messages yet"
                  description="Start the conversation!"
                />
              </div>
            ) : (
              messages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  currentUserId={currentUserId}
                  onReaction={onReaction}
                  onReply={handleReply}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <Composer
            onSendMessage={(content, attachments, gif, replyToParam) => onSendMessage(content, attachments, gif, replyToParam)}
            placeholder="Type a message..."
            replyTo={replyTo}
            onCancelReply={handleCancelReply}
          />
        </>
      )}
    </div>
  )
}

export function ConversationHeader({
  conversation,
  currentUserId,
  onDeleteConversation,
  onRefreshMessages,
  onToggleSidebar
}: {
  conversation: Conversation | null
  currentUserId: string
  onDeleteConversation?: (conversationId: string) => void
  onRefreshMessages?: () => void
  onToggleSidebar?: () => void
}) {
  const { isDark } = useTheme()
  const [showMenu, setShowMenu] = useState(false)
  const [conversationName, setConversationName] = useState('')
  const [sentMessageColor, setSentMessageColor] = useState('#3b82f6')
  const [receivedMessageColor, setReceivedMessageColor] = useState('#374151')
  const [showNicknameModal, setShowNicknameModal] = useState(false)
  const [showThemeModal, setShowThemeModal] = useState(false)
  const [newConversationName, setNewConversationName] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!conversation) return

    const storedName = localStorage.getItem(`conversationName_${conversation.id}`)
    if (storedName) {
      setConversationName(storedName)
    } else {
      // Default to other participant's name or group name
      const defaultName = conversation.participants.length === 2 && currentUserId
        ? conversation.participants.find(p => p.id !== currentUserId)?.name || conversation.participants.map(p => p.name).join(', ')
        : conversation.participants.map(p => p.name).join(', ')
      setConversationName(defaultName)
    }

    const storedSentColor = localStorage.getItem('sentMessageColor')
    if (storedSentColor) setSentMessageColor(storedSentColor)

    const storedReceivedColor = localStorage.getItem('receivedMessageColor')
    if (storedReceivedColor) setReceivedMessageColor(storedReceivedColor)

    // Close menus when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [conversation, currentUserId])

  if (!conversation) return null

  const handleDeleteConversation = async () => {
    setShowDeleteModal(true)
    setShowMenu(false)
  }

  const confirmDeleteConversation = async () => {
    try {
      const response = await fetch(`/api/messaging/conversations/${conversation.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        onDeleteConversation?.(conversation.id)
        console.log('Conversation deleted successfully')
        // Refresh the page to update the conversation list
        window.location.reload()
      } else {
        console.error('Failed to delete conversation')
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
    setShowDeleteModal(false)
  }

  return (
    <div>
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
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
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {otherParticipant?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )
              })()
            ) : (
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <h2 className="font-semibold">
                {conversationName}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                {conversation.participants.length === 2 && currentUserId
                  ? (() => {
                      const otherParticipant = conversation.participants.find(p => p.id !== currentUserId)
                      const isOnline = otherParticipant?.online
                      return (
                        <>
                          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-blue-500' : 'bg-gray-400'}`}></span>
                          {isOnline ? 'active' : 'inactive'}
                        </>
                      )
                    })()
                  : 'group chat'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={`p-2 rounded-lg transition-colors hover:bg-${isDark ? 'white/10' : 'slate-100'}`}
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showMenu && (
                <div ref={menuRef} className={`absolute right-0 mt-2 w-56 ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-md shadow-lg border ${isDark ? 'border-slate-700' : 'border-slate-200'} z-10`}>
                  <button
                    onClick={() => {
                      onRefreshMessages?.()
                      setShowMenu(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'} transition-colors flex items-center gap-2`}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                  <button
                    onClick={() => {
                      setNewConversationName(conversationName)
                      setShowNicknameModal(true)
                      setShowMenu(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'} transition-colors`}
                  >
                    Change Conversation Name
                  </button>
                  <button
                    onClick={() => {
                      setShowThemeModal(true)
                      setShowMenu(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'} transition-colors`}
                  >
                    Change Message Colors
                  </button>
                  <button
                    onClick={handleDeleteConversation}
                    className={`w-full text-left px-4 py-2 text-sm text-red-600 ${isDark ? 'hover:bg-red-900/20' : 'hover:bg-red-50'} transition-colors`}
                  >
                    Delete Conversation
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Conversation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-lg max-w-md w-full mx-4 ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}>
            <h3 className="text-lg font-semibold mb-4">Delete Conversation</h3>
            <p className="text-sm mb-6">Are you sure you want to delete this conversation? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className={`px-4 py-2 rounded-md ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'} transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteConversation}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Conversation Name Modal */}
      {showNicknameModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-lg max-w-md w-full mx-4 ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}>
            <h3 className="text-lg font-semibold mb-4">Change Conversation Name</h3>
            <input
              type="text"
              value={newConversationName}
              onChange={(e) => setNewConversationName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md mb-4 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
              placeholder="Enter new conversation name"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNicknameModal(false)}
                className={`px-4 py-2 rounded-md ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'} transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newConversationName.trim()) {
                    setConversationName(newConversationName.trim())
                    localStorage.setItem(`conversationName_${conversation.id}`, newConversationName.trim())
                    // Trigger storage event to update sidebar
                    window.dispatchEvent(new StorageEvent('storage', {
                      key: `conversationName_${conversation.id}`,
                      newValue: newConversationName.trim()
                    }))
                  }
                  setShowNicknameModal(false)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Message Colors Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-lg max-w-md w-full mx-4 ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}>
            <h3 className="text-lg font-semibold mb-4">Change Message Colors</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Sent Message Color</label>
                <input
                  type="color"
                  value={sentMessageColor}
                  onChange={(e) => {
                    setSentMessageColor(e.target.value)
                    localStorage.setItem('sentMessageColor', e.target.value)
                  }}
                  className="w-full h-10 rounded-md border cursor-pointer"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Received Message Color</label>
                <input
                  type="color"
                  value={receivedMessageColor}
                  onChange={(e) => {
                    setReceivedMessageColor(e.target.value)
                    localStorage.setItem('receivedMessageColor', e.target.value)
                  }}
                  className="w-full h-10 rounded-md border cursor-pointer"
                />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowThemeModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
