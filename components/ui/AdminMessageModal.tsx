'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { X, Loader2 } from 'lucide-react'
import { ConversationView } from '@/components/ui/ConversationView'
import { useAdminMessaging } from '@/lib/hooks/useAdminMessaging'
import { useTheme } from '@/components/ThemeContext'

interface Member {
  id: string
  name: string
  email: string
  image?: string | null
}

interface AdminMessageModalProps {
  isOpen: boolean
  onClose: () => void
  member: Member | null
}

export function AdminMessageModal({ isOpen, onClose, member }: AdminMessageModalProps) {
  const { data: session } = useSession()
  const { isDark } = useTheme()

  const {
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
  } = useAdminMessaging()

  useEffect(() => {
    if (isOpen && member && !conversation) {
      initializeConversation(member.id)
    } else if (!isOpen) {
      clearConversation()
    }
  }, [isOpen, member, conversation, initializeConversation, clearConversation])

  const handleClose = () => {
    clearConversation()
    onClose()
  }

  if (!isOpen || !member) return null

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleClose}>
      {/* Close Button - Outside the modal */}
      <button
        onClick={handleClose}
        className={`absolute top-4 right-4 p-2 rounded-lg transition-colors duration-200 z-10 ${
          isDark
            ? 'bg-slate-600 text-slate-400 hover:text-white hover:bg-slate-700'
            : 'bg-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-300'
        }`}
      >
        <X className="w-5 h-5" />
      </button>

      <div className={`relative w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl border overflow-hidden ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      }`} onClick={(e) => e.stopPropagation()}>
        {/* Content */}
        <div className="flex flex-col h-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                  Loading messages...
                </span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className={`text-lg font-medium mb-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Error loading conversation
                </p>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {error}
                </p>
              </div>
            </div>
          ) : conversation ? (
            <ConversationView
              conversation={{
                ...conversation,
                participants: conversation.participants.map(p => ({
                  ...p,
                  online: onlineUsers.has(p.id)
                }))
              }}
              messages={messages}
              currentUserId={session?.user?.id || ''}
              onSendMessage={(content, attachments, gif, replyTo) =>
                sendMessage(content, attachments, replyTo, gif)
              }
              onReaction={(messageId, emoji, action) => {
                if (action === 'add') {
                  addReaction(messageId, emoji)
                } else {
                  removeReaction(messageId, emoji)
                }
              }}
              onReply={(messageId, replyToMessage) => {
                // Handle reply - this would need to be implemented in ConversationView
                console.log('Reply to:', messageId, replyToMessage)
              }}
              onDelete={deleteMessage}
              onEdit={editMessage}
              onRefreshMessages={refreshMessages}
              loading={false}
              isAdmin={true}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className={`text-lg font-medium mb-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  No conversation found
                </p>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Unable to load conversation with this member
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
