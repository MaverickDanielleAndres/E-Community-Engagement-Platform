'use client'

import { useEffect, useRef, useState } from 'react'
import { Users, MoreVertical } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { MessageItem } from '@/components/ui/MessageItem'
import { Composer } from '@/components/ui/Composer'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { useTheme } from '@/components/ThemeContext'

interface Conversation {
  id: string
  participants: Array<{
    id: string
    name: string
    avatar?: string
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
  loading?: boolean
  replyTo?: { id: string; content: string; senderName: string } | null
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
  loading = false,
  replyTo: propReplyTo
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

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={Users}
          title="Select a conversation"
          description="Choose a conversation from the list to start messaging"
        />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <ConversationHeader conversation={conversation} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
    </div>
  )
}

export function ConversationHeader({
  conversation,
  onDeleteConversation
}: {
  conversation: Conversation | null
  onDeleteConversation?: (conversationId: string) => void
}) {
  const { isDark } = useTheme()
  const [showMenu, setShowMenu] = useState(false)

  if (!conversation) return null

  const [showDeleteModal, setShowDeleteModal] = useState(false)

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
    <div className="p-4 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">
              {conversation.participants.map(p => p.name).join(', ')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {conversation.participants.length} members
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`p-2 rounded-lg transition-colors hover:bg-${isDark ? 'white/10' : 'slate-100'}`}
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 z-10">
              <button
                onClick={handleDeleteConversation}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              >
                Delete Conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Conversation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteConversation}
        title="Delete Conversation"
        message="Are you sure you want to delete this conversation? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  )
}
