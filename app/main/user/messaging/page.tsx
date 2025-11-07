'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ConversationList } from '@/components/ui/ConversationList'
import { ConversationView } from '@/components/ui/ConversationView'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { NewConversationModal } from '@/components/ui/NewConversationModal'
import { useMessaging } from '@/lib/hooks/useMessaging'
import { Menu, X } from 'lucide-react'
import { useTheme } from '@/components/ThemeContext'

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

export default function MessagingPage() {
  const { data: session } = useSession()
  const { isDark } = useTheme()
  const [showNewConversationModal, setShowNewConversationModal] = useState(false)
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; senderName: string } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const {
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
    onlineUsers,
    refreshMessages
  } = useMessaging()

  // Update conversations with online status and typing indicators
  const enhancedConversations = conversations.map(conv => ({
    ...conv,
    participants: conv.participants.map(p => ({
      ...p,
      online: onlineUsers.has(p.id)
    })),
    typingUsers: typingIndicators
      .filter(t => t.conversationId === conv.id)
      .map(t => t.userName)
  }))

  const handleSendMessage = async (content: string, attachments?: any[], gif?: any, replyToParam?: { id: string; content: string; senderName: string }) => {
    if ((!content.trim() && attachments?.length === 0 && !gif) || !selectedConversation) return

    try {
      await sendMessage(content, attachments, replyToParam, gif)
      stopTyping() // Stop typing when message is sent
      setReplyTo(null) // Clear reply state after sending
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleReaction = (messageId: string, emoji: string, action: 'add' | 'remove') => {
    if (action === 'add') {
      addReaction(messageId, emoji)
    } else {
      removeReaction(messageId, emoji)
    }
  }

  const handleReply = (messageId: string, replyTo: Message) => {
    // Set reply state for composer
    setReplyTo(replyTo)
  }

  const handleDelete = (messageId: string) => {
    deleteMessage(messageId)
  }

  const handleEdit = (messageId: string, newContent: string) => {
    editMessage(messageId, newContent)
  }

  const handleNewConversation = () => {
    setShowNewConversationModal(true)
  }

  const handleCreateConversation = async (memberIds: string[]) => {
    try {
      await createConversation(memberIds)
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
  }

  const handleTyping = (isTyping: boolean) => {
    if (isTyping) {
      startTyping()
    } else {
      stopTyping()
    }
  }

  const handleSelectConversation = (conversation: any) => {
    const original = conversations.find(c => c.id === conversation.id)
    selectConversation(original || null)
    // Auto-close sidebar on mobile when conversation is selected
    setSidebarOpen(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <>
      <div className="h-[calc(100vh-8rem)] flex relative">

        {/* Sidebar */}
        <div className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          fixed md:relative
          top-0 left-0
          h-full
          z-40 md:z-auto
          transition-transform duration-300 ease-in-out
          w-80
        `}>
          <ConversationList
            conversations={enhancedConversations}
            selectedConversation={selectedConversation}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            loading={isLoading}
            currentUserId={session?.user?.id || ''}
            isMobile={sidebarOpen}
            onCloseMobile={() => setSidebarOpen(false)}
          />
        </div>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 md:ml-0 relative">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`absolute left-4 top-4 z-10 p-2 rounded-lg transition-colors md:hidden ${
              isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            } shadow-lg`}
            title="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <ConversationView
            conversation={selectedConversation ? {
              ...selectedConversation,
              participants: selectedConversation.participants.map(p => ({
                ...p,
                online: onlineUsers.has(p.id)
              }))
            } : null}
            messages={messages}
            currentUserId={session?.user?.id || ''}
            onSendMessage={handleSendMessage}
            onReaction={handleReaction}
            onReply={handleReply}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onRefreshMessages={refreshMessages}
            loading={false}
            replyTo={replyTo}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        </div>
      </div>

      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onCreateConversation={handleCreateConversation}
      />
    </>
  )
}
