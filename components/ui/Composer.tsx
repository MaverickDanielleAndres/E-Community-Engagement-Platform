'use client'

import { useState, useRef } from 'react'
import { Send, Paperclip, Mic, Smile, X, Image, Images, MoreVertical } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import { GifPicker } from './GifPicker'
import { useTheme } from '@/components/ThemeContext'

interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url?: string
  file?: File
}

interface GifData {
  id: string
  title: string
  url: string
  preview: string
  width: number
  height: number
}

interface ComposerProps {
  onSendMessage: (content: string, attachments?: Attachment[], gif?: GifData, replyTo?: { id: string; content: string; senderName: string }) => void
  placeholder?: string
  disabled?: boolean
  replyTo?: { id: string; content: string; senderName: string } | null
  onCancelReply?: () => void
}

export function Composer({
  onSendMessage,
  placeholder = "Type a message...",
  disabled = false,
  replyTo,
  onCancelReply
}: ComposerProps) {
  const { isDark } = useTheme()
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const handleSend = () => {
    if (!message.trim() && attachments.length === 0) return

    onSendMessage(message, attachments, undefined, replyTo || undefined)
    setMessage('')
    setAttachments([])
    onCancelReply?.()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    const imageFiles: File[] = []

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile()
        if (file) {
          imageFiles.push(file)
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault() // Prevent default paste behavior

      const maxFileSize = 10 * 1024 * 1024 // 10MB

      const validFiles: File[] = []
      const invalidFiles: string[] = []

      imageFiles.forEach(file => {
        if (file.size > maxFileSize) {
          invalidFiles.push(`${file.name}: File size exceeds 10MB`)
        } else {
          validFiles.push(file)
        }
      })

      if (invalidFiles.length > 0) {
        console.warn('Invalid files:', invalidFiles)
        alert(`Some files were rejected:\n${invalidFiles.join('\n')}`)
      }

      const newAttachments: Attachment[] = validFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name || `pasted-image-${Date.now()}.png`,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        file: file // Store the actual file for upload
      }))

      setAttachments(prev => [...prev, ...newAttachments])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const maxFileSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg',
      'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/webm',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    const validFiles: File[] = []
    const invalidFiles: string[] = []

    Array.from(files).forEach(file => {
      if (file.size > maxFileSize) {
        invalidFiles.push(`${file.name}: File size exceeds 10MB`)
      } else if (!allowedTypes.includes(file.type)) {
        invalidFiles.push(`${file.name}: File type not supported`)
      } else {
        validFiles.push(file)
      }
    })

    if (invalidFiles.length > 0) {
      // Could show a toast or alert here
      console.warn('Invalid files:', invalidFiles)
      alert(`Some files were rejected:\n${invalidFiles.join('\n')}`)
    }

    const newAttachments: Attachment[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: file.size,
      file: file // Store the actual file for upload
    }))

    setAttachments(prev => [...prev, ...newAttachments])
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const maxFileSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg'
    ]

    const validFiles: File[] = []
    const invalidFiles: string[] = []

    Array.from(files).forEach(file => {
      if (file.size > maxFileSize) {
        invalidFiles.push(`${file.name}: File size exceeds 10MB`)
      } else if (!allowedTypes.includes(file.type)) {
        invalidFiles.push(`${file.name}: File type not supported`)
      } else {
        validFiles.push(file)
      }
    })

    if (invalidFiles.length > 0) {
      // Could show a toast or alert here
      console.warn('Invalid files:', invalidFiles)
      alert(`Some files were rejected:\n${invalidFiles.join('\n')}`)
    }

    const newAttachments: Attachment[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: file.size,
      url: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      file: file // Store the actual file for upload
    }))

    setAttachments(prev => [...prev, ...newAttachments])
  }

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id))
  }

  const handleVoiceRecord = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      setIsRecording(false)
      setRecordingTime(0)
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder

        const chunks: Blob[] = []
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data)
          }
        }

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(chunks, { type: 'audio/wav' })
          const audioFile = new File([audioBlob], `voice-message-${Date.now()}.wav`, { type: 'audio/wav' })

          // Create attachment for the voice message
          const voiceAttachment: Attachment = {
            id: Math.random().toString(36).substr(2, 9),
            name: audioFile.name,
            type: audioFile.type,
            size: audioFile.size,
            file: audioFile // Store the actual file for upload
          }

          setAttachments(prev => [...prev, voiceAttachment])

          // Clean up
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
          }
        }

        mediaRecorder.start()
        setIsRecording(true)

        // Start timer
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)

      } catch (error) {
        console.error('Error accessing microphone:', error)
        // Could show an error toast here
      }
    }
  }

  const handleEmojiClick = (emojiData: any) => {
    setMessage(prev => prev + emojiData.emoji)
    setShowEmojiPicker(false)
  }

  const handleGifSelect = (gif: GifData) => {
    onSendMessage('', [], gif)
    setShowGifPicker(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="p-4 border-t border-slate-200 dark:border-slate-700" onPaste={handlePaste}>
      {/* Reply Preview */}
      {replyTo && (
        <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border-l-4 border-blue-500 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Replying to <span className="font-medium">{replyTo.senderName}</span>
            </p>
            <p className="text-sm text-slate-800 dark:text-slate-200 truncate">
              {replyTo.content}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2"
            >
              <Paperclip className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-32">
                {attachment.name}
              </span>
              <span className="text-xs text-slate-500">
                ({formatFileSize(attachment.size)})
              </span>
              <button
                onClick={() => removeAttachment(attachment.id)}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Message Input */}
      <div className="flex items-center gap-2">
        {/* Attach Menu Button - Desktop */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className={`p-2 rounded-lg transition-colors hover:bg-${isDark ? 'white/10' : 'slate-100'}`}
            disabled={disabled}
            title="Attach"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          {showAttachMenu && (
            <div className={`absolute bottom-full left-0 mb-2 w-48 ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-md shadow-lg border ${isDark ? 'border-slate-700' : 'border-slate-200'} z-[9999]`}>
              <button
                onClick={() => {
                  fileInputRef.current?.click()
                  setShowAttachMenu(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'} transition-colors flex items-center gap-2`}
              >
                <Paperclip className="w-4 h-4" />
                Send File
              </button>
              <button
                onClick={() => {
                  handleVoiceRecord()
                  setShowAttachMenu(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'} transition-colors flex items-center gap-2`}
              >
                <Mic className="w-4 h-4" />
                Voice Record
              </button>
              <button
                onClick={() => {
                  imageInputRef.current?.click()
                  setShowAttachMenu(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'} transition-colors flex items-center gap-2`}
              >
                <Images className="w-4 h-4" />
                Image/Video
              </button>
              <button
                onClick={() => {
                  setShowGifPicker(!showGifPicker)
                  setShowAttachMenu(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'} transition-colors flex items-center gap-2`}
              >
                <Smile className="w-4 h-4" />
                GIF
              </button>
            </div>
          )}
        </div>

        {/* Attach Menu Button - Mobile/Tablet */}
        <div className="relative md:hidden">
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className={`p-2 rounded-lg transition-colors hover:bg-${isDark ? 'white/10' : 'slate-100'}`}
            disabled={disabled}
            title="Attach"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          {showAttachMenu && (
            <div className={`absolute bottom-full left-0 mb-2 w-48 ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-md shadow-lg border ${isDark ? 'border-slate-700' : 'border-slate-200'} z-[9999]`}>
              <button
                onClick={() => {
                  fileInputRef.current?.click()
                  setShowAttachMenu(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'} transition-colors flex items-center gap-2`}
              >
                <Paperclip className="w-4 h-4" />
                Send File
              </button>
              <button
                onClick={() => {
                  handleVoiceRecord()
                  setShowAttachMenu(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'} transition-colors flex items-center gap-2`}
              >
                <Mic className="w-4 h-4" />
                Voice Record
              </button>
              <button
                onClick={() => {
                  imageInputRef.current?.click()
                  setShowAttachMenu(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'} transition-colors flex items-center gap-2`}
              >
                <Images className="w-4 h-4" />
                Image/Video
              </button>
              <button
                onClick={() => {
                  setShowGifPicker(!showGifPicker)
                  setShowAttachMenu(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'} transition-colors flex items-center gap-2`}
              >
                <Smile className="w-4 h-4" />
                GIF
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={`w-full px-4 py-2 pr-12 h-10 rounded-lg border border-slate-200 dark:border-slate-600 ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50`}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            <button
              onClick={() => setMessage('')}
              className={`p-1 rounded transition-colors hover:bg-${isDark ? 'white/10' : 'slate-100'} ${
                message ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-1 rounded transition-colors hover:bg-${isDark ? 'white/10' : 'slate-100'} mr-2`}
              disabled={disabled}
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop buttons - hidden on mobile/tablet */}
        <button
          onClick={handleVoiceRecord}
          className={`hidden md:flex p-2 rounded-lg transition-colors ${
            isRecording
              ? 'bg-red-500 text-white hover:bg-red-600'
              : `hover:bg-${isDark ? 'white/10' : 'slate-100'}`
          }`}
          disabled={disabled}
        >
          <Mic className="w-5 h-5" />
        </button>

        <button
          onClick={() => imageInputRef.current?.click()}
          className={`hidden md:flex p-2 rounded-lg transition-colors hover:bg-${isDark ? 'white/10' : 'slate-100'}`}
          disabled={disabled}
          title="Image/Video"
        >
          <Images className="w-5 h-5" />
        </button>

        <div className="relative hidden md:block">
          <button
            onClick={() => setShowGifPicker(!showGifPicker)}
            className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium hover:bg-${isDark ? 'white/10' : 'slate-100'}`}
            disabled={disabled}
            title="GIF"
          >
            GIF
          </button>
          {showGifPicker && (
            <div className="absolute bottom-full right-0 mb-2 z-50">
              <GifPicker
                onSelectGif={handleGifSelect}
                onClose={() => setShowGifPicker(false)}
              />
            </div>
          )}
        </div>

        <button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && attachments.length === 0)}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="fixed bottom-20 right-4 z-[9999] shadow-lg rounded-lg overflow-hidden bg-white dark:bg-slate-900">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={isDark ? 'dark' : 'light' as any}
            width={300}
            height={400}
          />
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,video/*,audio/*,application/*,text/*"
      />
      <input
        ref={imageInputRef}
        type="file"
        multiple
        onChange={handleImageSelect}
        className="hidden"
        accept="image/*,video/*"
      />

      {/* Recording indicator */}
      {isRecording && (
        <div className="mt-2 flex items-center gap-2 text-red-500">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm">Recording... {recordingTime}s</span>
        </div>
      )}
    </div>
  )
}
