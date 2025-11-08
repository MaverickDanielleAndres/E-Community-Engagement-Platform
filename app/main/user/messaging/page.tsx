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
  const [isMobile, setIsMobile] = useState(false)

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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  const handleCreateConversation = async (memberIds: string[], isGroup?: boolean) => {
    try {
      await createConversation(memberIds, isGroup)
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
    if (isMobile) {
      setSidebarOpen(false)
    }
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
      <div className={`h-[calc(100vh-8rem)] flex flex-col relative ${isMobile ? 'px-0' : 'px-4'}`}>

        {/* Mobile/Tablet: Always visible conversation toggle at top */}
        {isMobile && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-700'}`}
              title="Toggle conversation list"
            >
              <Menu className="w-5 h-5" />
              <span className="text-sm font-medium">Conversations</span>
            </button>
          </div>
        )}

        {/* Content area */}
        <div className={`flex flex-1 relative ${isMobile ? 'px-0' : 'px-4'}`}>

          {/* Sidebar - Overlay on mobile */}
          {isMobile ? (
            <>
              {sidebarOpen && (
                <>
                  <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
                  <div className="fixed top-0 left-0 h-full w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 z-50">
                    <ConversationList
                      conversations={enhancedConversations}
                      selectedConversation={selectedConversation}
                      onSelectConversation={handleSelectConversation}
                      onNewConversation={handleNewConversation}
                      loading={isLoading}
                      currentUserId={session?.user?.id || ''}
                      isMobile={true}
                      onCloseMobile={() => setSidebarOpen(false)}
                    />
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-80 border-r border-slate-200 dark:border-slate-700">
              <ConversationList
                conversations={enhancedConversations}
                selectedConversation={selectedConversation}
                onSelectConversation={handleSelectConversation}
                onNewConversation={handleNewConversation}
                loading={isLoading}
                currentUserId={session?.user?.id || ''}  
                isMobile={false}
                onCloseMobile={() => setSidebarOpen(false)}
              />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 relative">
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
      </div>

      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onCreateConversation={handleCreateConversation}
      />
    </>
  )
}
