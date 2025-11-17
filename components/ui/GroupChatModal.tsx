'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Settings, Trash2, Palette, MessageCircle, Crown, User } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { MessageItem } from '@/components/ui/MessageItem'
import { Composer } from '@/components/ui/Composer'
import { useTheme } from '@/components/ThemeContext'
import { useSession } from 'next-auth/react'
import { getSupabaseClient } from '@/lib/supabase'
import { useRealtimeConversation } from '@/lib/hooks/useRealtimeConversation'

interface Member {
  id: string
  name: string
  email: string
  avatar_url?: string
  role: string
  status?: string
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
  readBy?: Array<{
    userId: string
    userName: string
    readAt: string
  }>
  isDelivered?: boolean
  isEdited?: boolean
  role?: string
}

interface GroupChatModalProps {
  isOpen: boolean
  onClose: () => void
  conversationId: string
  isAdmin: boolean
}

export function GroupChatModal({
  isOpen,
  onClose,
  conversationId,
  isAdmin
}: GroupChatModalProps) {
  const { data: session } = useSession()
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [chatName, setChatName] = useState('Group Chat')
  const [adminMessageColor, setAdminMessageColor] = useState('#f59e0b')
  const [memberMessageColor, setMemberMessageColor] = useState('#10b981')
  const [selfMessageColor, setSelfMessageColor] = useState('#3b82f6')
  const [showSettings, setShowSettings] = useState(false)
  const [newChatName, setNewChatName] = useState('')
  const [newAdminMessageColor, setNewAdminMessageColor] = useState('')
  const [newMemberMessageColor, setNewMemberMessageColor] = useState('')
  const [newSelfMessageColor, setNewSelfMessageColor] = useState('')
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; senderName: string } | null>(null)

  // Real-time conversation updates
  useRealtimeConversation({
    conversationId: conversationId || null,
    onMessageInsert: (message) => {
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(msg => msg.id === message.id)) {
          return prev
        }
        return [...prev, message]
      })
    },
    onMessageUpdate: (messageId, updates) => {
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ))
    },
    onMessageDelete: (messageId) => {
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
    },
    onReactionChange: () => {
      if (conversationId) {
        fetchMessages(conversationId)
      }
    },
    onRefresh: () => {
      if (conversationId) {
        fetchMessages(conversationId)
      }
    }
  })

  useEffect(() => {
    if (isOpen && conversationId) {
      fetchGroupChatData()
    }
  }, [isOpen, conversationId])

  const fetchMessages = async (convId: string) => {
    try {
      const messagesResponse = await fetch(`/api/messaging/conversations/${convId}/messages`)
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json()
        setMessages(messagesData.messages || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const fetchGroupChatData = async () => {
    setLoading(true)
    try {
      // Fetch conversation details and settings
      const convResponse = await fetch(`/api/messaging/conversations/${conversationId}`)
      if (convResponse.ok) {
        const convData = await convResponse.json()
        setChatName(convData.title || 'Group Chat')
      }

      // Fetch conversation settings for message colors
      const settingsResponse = await fetch(`/api/messaging/conversations/${conversationId}/settings`)
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        setAdminMessageColor(settingsData.adminMessageColor || '#f59e0b')
        setMemberMessageColor(settingsData.memberMessageColor || '#10b981')
        setSelfMessageColor(settingsData.selfMessageColor || '#3b82f6')
      }

      // Fetch messages
      await fetchMessages(conversationId)

      // Fetch members - use admin members endpoint since this is admin context
      const membersResponse = await fetch('/api/admin/members')
      if (membersResponse.ok) {
        const membersData = await membersResponse.json()
        setMembers(membersData.members || [])
      }
    } catch (error) {
      console.error('Error fetching group chat data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (content: string, attachments?: any[], gif?: any, replyTo?: any) => {
    if (!content.trim() && (!attachments || attachments.length === 0) && !gif) return

    try {
      const formData = new FormData()

      // Add content
      if (content.trim()) {
        formData.append('content', content.trim())
      }

      // Add type
      if (gif) {
        formData.append('type', 'gif')
      } else if (attachments && attachments.length > 0) {
        formData.append('type', 'file')
      } else {
        formData.append('type', 'text')
      }

      // Add reply to message ID
      if (replyTo?.id) {
        formData.append('replyToMessageId', replyTo.id)
      }

      // Add gif data
      if (gif) {
        formData.append('gif', JSON.stringify(gif))
      }

      // Add attachments
      if (attachments && attachments.length > 0) {
        attachments.forEach((attachment) => {
          if (attachment.file) {
            formData.append('attachments', attachment.file)
          }
        })
      }

      const response = await fetch(`/api/messaging/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        // Message sent successfully, real-time update will handle UI refresh
        // No need to fetch messages again as real-time will update
        setReplyTo(null) // Clear reply state after sending
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleReaction = (messageId: string, emoji: string, action: 'add' | 'remove') => {
    // Handle reaction logic here
    console.log('Reaction:', messageId, emoji, action)
  }

  const handleUpdateChatName = async () => {
    if (!newChatName.trim()) return

    try {
      const response = await fetch(`/api/messaging/conversations/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newChatName.trim()
        }),
      })

      if (response.ok) {
        const updatedName = newChatName.trim()
        setChatName(updatedName)
        setShowSettings(false)
        setNewChatName('')
        // Update localStorage and trigger storage event for UI sync
        localStorage.setItem(`conversationName_${conversationId}`, updatedName)
        window.dispatchEvent(new StorageEvent('storage', {
          key: `conversationName_${conversationId}`,
          newValue: updatedName
        }))
      }
    } catch (error) {
      console.error('Error updating chat name:', error)
    }
  }



  const handleUpdateMessageColor = async (colorType: string, color: string) => {
    if (!color || !isAdmin) return

    try {
      const response = await fetch(`/api/messaging/conversations/${conversationId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [colorType]: color
        }),
      })

      if (response.ok) {
        // Refresh data to ensure settings are updated
        await fetchGroupChatData()
        setShowSettings(false)
        // Reset new color states
        setNewAdminMessageColor('')
        setNewMemberMessageColor('')
        setNewSelfMessageColor('')
      }
    } catch (error) {
      console.error('Error updating message color:', error)
    }
  }

  const handleClearMessages = async () => {
    if (!isAdmin) return

    try {
      const response = await fetch(`/api/messaging/conversations/${conversationId}/clear`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMessages([])
        setShowSettings(false)
        setShowClearConfirm(false)
      }
    } catch (error) {
      console.error('Error clearing messages:', error)
    }
  }

  const handleDeleteChat = async () => {
    if (!isAdmin) return

    try {
      const response = await fetch(`/api/messaging/conversations/${conversationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onClose()
        // Refresh the page to update conversation list
        window.location.reload()
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed inset-4 md:inset-8 lg:inset-16 ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'} rounded-lg shadow-xl z-50 flex flex-col`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500"
                >
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className={`text-xl font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {chatName}
                    {isAdmin && <Crown className="w-4 h-4 text-yellow-500" />}
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {members.length} members
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && isAdmin && (
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                <div className="space-y-6">
                  {/* Chat Name Section */}
                  <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                    <div className="flex-1">
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Chat Name
                      </label>
                      <input
                        type="text"
                        value={newChatName}
                        onChange={(e) => setNewChatName(e.target.value)}
                        placeholder={chatName}
                        className={`w-full px-3 py-2 border rounded-md ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'}`}
                      />
                    </div>
                    <button
                      onClick={handleUpdateChatName}
                      disabled={!newChatName.trim()}
                      className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                    >
                      Update Name
                    </button>
                  </div>

                  {/* Message Colors Section */}
                  <div>
                    <h3 className={`text-sm font-medium mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Message Colors
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Member Message Color */}
                      <div className="flex flex-col gap-2">
                        <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          Member Messages
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={newMemberMessageColor || memberMessageColor}
                            onChange={(e) => setNewMemberMessageColor(e.target.value)}
                            className="w-16 h-12 rounded-lg border-2 border-slate-300 cursor-pointer"
                          />
                          <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {newMemberMessageColor || memberMessageColor}
                          </span>
                          <button
                            onClick={() => handleUpdateMessageColor('memberMessageColor', newMemberMessageColor || memberMessageColor)}
                            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                          >
                            Update
                          </button>
                        </div>
                      </div>

                      {/* Self Message Color */}
                      <div className="flex flex-col gap-2">
                        <label className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          Your Messages
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={newSelfMessageColor || selfMessageColor}
                            onChange={(e) => setNewSelfMessageColor(e.target.value)}
                            className="w-16 h-12 rounded-lg border-2 border-slate-300 cursor-pointer"
                          />
                          <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {newSelfMessageColor || selfMessageColor}
                          </span>
                          <button
                            onClick={() => handleUpdateMessageColor('selfMessageColor', newSelfMessageColor || selfMessageColor)}
                            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="border-t border-slate-200 dark:border-slate-600 pt-4">
                    <h3 className={`text-sm font-medium mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Danger Zone
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setShowClearConfirm(true)}
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear All Messages
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                    .map((message) => (
                      <MessageItem
                        key={message.id}
                        message={message}
                        currentUserId={session?.user?.id || ''}
                        onReaction={handleReaction}
                        onReply={(messageId, replyTo) => setReplyTo({
                          id: replyTo.id,
                          content: replyTo.content,
                          senderName: replyTo.senderName
                        })}
                        onDelete={() => {}}
                        onEdit={() => {}}
                        adminMessageColor={adminMessageColor}
                        memberMessageColor={memberMessageColor}
                        selfMessageColor={selfMessageColor}
                        isGroupChat={true}
                      />
                    ))}
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-700">
              <Composer
                onSendMessage={handleSendMessage}
                placeholder="Type a message..."
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
              />
            </div>

            {/* Clear Messages Confirmation Modal */}
            {showClearConfirm && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className={`p-6 rounded-lg shadow-lg max-w-md w-full mx-4 ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}>
                  <h3 className="text-lg font-semibold mb-4">Clear All Messages</h3>
                  <p className="text-sm mb-6">Are you sure you want to clear all messages in this group chat? This action cannot be undone.</p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className={`px-4 py-2 rounded-md ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'} transition-colors`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleClearMessages}
                      className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                    >
                      Clear Messages
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className={`p-6 rounded-lg shadow-lg max-w-md w-full mx-4 ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}>
                  <h3 className="text-lg font-semibold mb-4">Delete Group Chat</h3>
                  <p className="text-sm mb-6">Are you sure you want to delete this group chat? This action cannot be undone and will remove all messages.</p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className={`px-4 py-2 rounded-md ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'} transition-colors`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteChat}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Delete Chat
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
