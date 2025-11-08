'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Reply, Heart, Smile, MoreVertical, Trash2, Edit } from 'lucide-react'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { ImageModal } from '@/components/ui/ImageModal'
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
}

interface MessageItemProps {
  message: Message
  currentUserId: string
  onReaction: (messageId: string, emoji: string, action: 'add' | 'remove') => void
  onReply: (messageId: string, replyTo: Message) => void
  onDelete?: (messageId: string) => void
  onEdit?: (messageId: string, newContent: string) => void
}

export function MessageItem({
  message,
  currentUserId,
  onReaction,
  onReply,
  onDelete,
  onEdit
}: MessageItemProps) {
  const { isDark } = useTheme()
  const [showReactions, setShowReactions] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showReadDetails, setShowReadDetails] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState('')
  const [showTimestamp, setShowTimestamp] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)
  const reactionsRef = useRef<HTMLDivElement>(null)

  const isOwnMessage = message.senderId === currentUserId
  const canEdit = isOwnMessage && onEdit
  const canDelete = isOwnMessage && onDelete

  // Read status logic
  const hasReads = message.readBy && message.readBy.length > 0
  const isRead = hasReads && message.readBy!.some(read => read.userId !== currentUserId)
  const readCount = hasReads ? message.readBy!.filter(read => read.userId !== currentUserId).length : 0

  // Get message colors from localStorage
  const sentMessageColor = localStorage.getItem('sentMessageColor') || '#3b82f6'
  const receivedMessageColor = localStorage.getItem('receivedMessageColor') || '#374151'

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
      if (reactionsRef.current && !reactionsRef.current.contains(event.target as Node)) {
        setShowReactions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleReaction = (emoji: string) => {
    const existingReaction = message.reactions?.find(r => r.emoji === emoji)
    const hasReacted = existingReaction?.users.includes(currentUserId)
    const action = hasReacted ? 'remove' : 'add'
    onReaction(message.id, emoji, action)
    setShowReactions(false)
  }

  const handleDelete = async () => {
    setShowDeleteModal(true)
    setShowMenu(false)
  }

  const confirmDelete = async () => {
    onDelete?.(message.id)
    setShowDeleteModal(false)
  }

  const handleEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit?.(message.id, editContent)
    }
    setIsEditing(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEdit()
    } else if (e.key === 'Escape') {
      setEditContent(message.content)
      setIsEditing(false)
    }
  }

  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡']

  // Edited indicator component
  const EditedIndicator = () => {
    if (!message.isEdited) return null

    return (
      <div className={`text-xs ${isDark ? 'text-white' : 'text-slate-500'} ${
        isOwnMessage ? 'text-right' : 'text-left'
      }`}>
        edited
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {/* Reply indicator */}
        {message.replyTo && (
          <div className={`mb-2 p-2 rounded-lg border-l-4 ${
            isOwnMessage
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-slate-400 bg-slate-50 dark:bg-slate-800/50'
          }`}>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Replying to {message.replyTo.senderName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
              {message.replyTo.content}
            </p>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`relative px-4 py-2 rounded-lg group cursor-pointer ${
            isOwnMessage
              ? `text-white`
              : 'text-slate-900 dark:text-slate-100'
          }`}
          style={{
            backgroundColor: isOwnMessage ? sentMessageColor : receivedMessageColor
          }}
          onClick={() => setShowTimestamp(!showTimestamp)}
        >
          {/* Message content */}
          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyPress={handleKeyPress}
              onBlur={handleEdit}
              className={`w-full bg-transparent border-none outline-none resize-none text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}
              autoFocus
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}

          {/* GIF */}
          {message.gif && (
            <div className="mt-2">
              <img
                src={message.gif.url}
                alt={message.gif.title}
                className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(message.gif?.url, '_blank')}
                style={{ maxWidth: '200px', maxHeight: '200px' }}
              />
            </div>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment) => {
                const isImage = attachment.type.startsWith('image/')
                const isVideo = attachment.type.startsWith('video/')
                const isAudio = attachment.type.startsWith('audio/')

                if (isImage) {
                  return (
                    <div key={attachment.id} className="relative">
                      {attachment.url ? (
                        <img
                          src={attachment.url}
                          alt={attachment.name}
                          className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          style={{ maxWidth: '250px', maxHeight: '250px' }}
                          onClick={() => {
                            if (attachment.url) {
                              setSelectedImageUrl(attachment.url)
                              setShowImageModal(true)
                            }
                          }}
                          onError={(e) => {
                            console.error('Image failed to load:', attachment.url)
                            e.currentTarget.style.display = 'none'
                            const errorDiv = e.currentTarget.nextElementSibling as HTMLElement
                            if (errorDiv) errorDiv.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div className={`p-3 rounded-lg border ${
                        isOwnMessage
                          ? 'border-slate-500 bg-slate-500/20'
                          : 'border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-600'
                      }`} style={{ display: attachment.url ? 'none' : 'block' }}>
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded flex items-center justify-center ${
                            isOwnMessage
                              ? 'bg-slate-600 dark:bg-slate-800 text-white'
                              : 'bg-slate-400 dark:bg-slate-500 text-slate-700 dark:text-slate-200'
                          }`}>
                            🖼️
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              isOwnMessage
                                ? 'text-white'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}>
                              {attachment.name}
                            </p>
                            <p className={`text-xs ${
                              isOwnMessage
                                ? 'text-slate-200'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}>
                              Image (loading failed)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                } else if (isVideo) {
                  return (
                    <div key={attachment.id} className="relative">
                      <video
                        src={attachment.url}
                        controls
                        className="max-w-full h-auto rounded-lg"
                        style={{ maxWidth: '200px', maxHeight: '200px' }}
                      />
                    </div>
                  )
                } else if (isAudio) {
                  return (
                    <div key={attachment.id} className="relative">
                      <audio
                        src={attachment.url}
                        controls
                        className="w-64 max-w-xs"
                      />
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Voice message
                      </div>
                    </div>
                  )
                } else {
                  return (
                    <div
                      key={attachment.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        isOwnMessage
                          ? 'border-blue-300 bg-blue-400/20 hover:bg-blue-400/30'
                          : 'border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500'
                      }`}
                      onClick={() => {
                        if (attachment.url) {
                          // Create a temporary link to trigger download
                          const link = document.createElement('a')
                          link.href = attachment.url
                          link.download = attachment.name
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded flex items-center justify-center ${
                          isOwnMessage
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-400 dark:bg-slate-500 text-slate-700 dark:text-slate-200'
                        }`}>
                          📎
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            isOwnMessage
                              ? 'text-white'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}>
                            {attachment.name}
                          </p>
                          <p className={`text-xs ${
                            isOwnMessage
                              ? 'text-blue-100'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            Click to download
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                }
              })}
            </div>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.reactions.map((reaction, index) => (
                <button
                  key={index}
                  onClick={() => handleReaction(reaction.emoji)}
                  className={`px-2 py-1 text-xs rounded-full border ${
                    isOwnMessage
                      ? 'border-blue-300 bg-blue-400/30 text-white'
                      : 'border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                  } hover:scale-110 transition-transform`}
                >
                  {reaction.emoji} {reaction.count}
                </button>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className={`absolute top-1/2 -translate-y-1/2 ${
            isOwnMessage ? 'left-0 -translate-x-full mr-2' : 'right-0 translate-x-full ml-2'
          } flex gap-0.5 p-1 opacity-0 group-hover:opacity-100 ${showTimestamp ? 'opacity-100' : ''} transition-opacity z-10`}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowReactions(!showReactions)
              }}
              className="p-1 rounded transition-transform text-slate-600 dark:text-slate-400 hover:scale-110"
              title="Add reaction"
            >
              <Smile className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onReply(message.id, message)
              }}
              className="p-1 rounded transition-transform text-slate-600 dark:text-slate-400 hover:scale-110"
              title="Reply to message"
            >
              <Reply className="w-3 h-3" />
            </button>
            {(canEdit || canDelete) && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(!showMenu)
                }}
                className="p-1 rounded transition-transform text-slate-600 dark:text-slate-400 hover:scale-110"
                title="More options"
              >
                <MoreVertical className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Reaction picker */}
          {showReactions && (
            <motion.div
              ref={reactionsRef}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`absolute bottom-full mb-2 p-2 rounded-lg shadow-lg ${
                isOwnMessage ? 'right-0' : 'left-0'
              } bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 z-50`}
            >
              <div className="flex gap-1">
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Menu */}
          {showMenu && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`absolute top-full mt-1 p-2 rounded-lg shadow-lg ${
                isOwnMessage ? 'right-0' : 'left-0'
              } bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 z-50`}
            >
              <div className="flex flex-col gap-1">
                {canEdit && (
                  <button
                    onClick={() => {
                      setIsEditing(true)
                      setShowMenu(false)
                    }}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Read details popup */}
          {showReadDetails && hasReads && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-full mt-2 p-3 rounded-lg shadow-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 min-w-48 z-10"
            >
              <h4 className="text-sm font-medium mb-2 text-slate-900 dark:text-slate-100">
                Read by ({readCount})
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {message.readBy
                  ?.filter(read => read.userId !== currentUserId)
                  .map((read) => (
                    <div key={read.userId} className="flex justify-between items-center text-xs">
                      <span className="text-slate-700 dark:text-slate-300 truncate">
                        {read.userName}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 ml-2">
                        {new Date(read.readAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Timestamp */}
        {showTimestamp && (
          <div className={`text-xs text-slate-500 dark:text-slate-400 mt-1 ${
            isOwnMessage ? 'text-right' : 'text-left'
          }`}>
            {new Date(message.timestamp).toLocaleString()}
          </div>
        )}

        {/* Edited indicator */}
        <EditedIndicator />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Image Modal */}
      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        imageUrl={selectedImageUrl}
        alt="Message attachment"
      />
    </motion.div>
  )
}
