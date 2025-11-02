'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ConversationList } from '@/components/ui/ConversationList'
import { ConversationView } from '@/components/ui/ConversationView'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { NewConversationModal } from '@/components/ui/NewConversationModal'
import { useMessaging } from '@/lib/hooks/useMessaging'

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
  const [showNewConversationModal, setShowNewConversationModal] = useState(false)
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; senderName: string } | null>(null)
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
    onlineUsers
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <>
      <div className="h-[calc(100vh-8rem)] flex">
        <ConversationList
          conversations={enhancedConversations}
          selectedConversation={selectedConversation}
          onSelectConversation={(conversation) => {
            const original = conversations.find(c => c.id === conversation.id)
            selectConversation(original || null)
          }}
          onNewConversation={handleNewConversation}
          loading={isLoading}
        />
        <ConversationView
          conversation={selectedConversation}
          messages={messages}
          currentUserId={session?.user?.id || ''}
          onSendMessage={handleSendMessage}
          onReaction={handleReaction}
          onReply={handleReply}
          onDelete={handleDelete}
          onEdit={handleEdit}
          loading={false}
          replyTo={replyTo}
        />
      </div>

      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onCreateConversation={handleCreateConversation}
      />
    </>
  )
}
