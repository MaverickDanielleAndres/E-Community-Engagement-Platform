'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, File, Image, Video, Music, FileText, Archive } from 'lucide-react'
import React from 'react'

interface Attachment {
  id: string
  name: string
  type: string
  url: string
  size?: number
  thumbnail?: string
}

interface AttachmentPreviewProps {
  attachments: Attachment[]
  onRemove?: (attachmentId: string) => void
  readonly?: boolean
}

export function AttachmentPreview({ attachments, onRemove, readonly = false }: AttachmentPreviewProps) {
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null)

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image
    if (type.startsWith('video/')) return Video
    if (type.startsWith('audio/')) return Music
    if (type.includes('pdf') || type.includes('document')) return FileText
    if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return Archive
    return File
  }

  const isImage = (type: string) => type.startsWith('image/')
  const isVideo = (type: string) => type.startsWith('video/')

  if (attachments.length === 0) return null

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-2">
        {attachments.map((attachment) => {
          const Icon = getFileIcon(attachment.type)

          return (
            <motion.div
              key={attachment.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative group"
            >
              <div
                className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                onClick={() => setSelectedAttachment(attachment)}
              >
                {/* Thumbnail or Icon */}
                <div className="flex-shrink-0">
                  {attachment.thumbnail || isImage(attachment.type) ? (
                    <img
                      src={attachment.thumbnail || attachment.url}
                      alt={attachment.name}
                      className="w-8 h-8 rounded object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-slate-300 dark:bg-slate-600 rounded flex items-center justify-center">
                      <Icon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {attachment.name}
                  </p>
                  {attachment.size && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatFileSize(attachment.size)}
                    </p>
                  )}
                </div>

                {/* Download button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(attachment.url, '_blank')
                  }}
                  className="p-1 rounded hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Download className="w-3 h-3" />
                </button>

                {/* Remove button */}
                {!readonly && onRemove && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemove(attachment.id)
                    }}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3 text-red-500" />
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Full Preview Modal */}
      <AnimatePresence>
        {selectedAttachment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedAttachment(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl max-h-[90vh] w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {selectedAttachment.name}
                  </h3>
                  {selectedAttachment.size && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatFileSize(selectedAttachment.size)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => window.open(selectedAttachment.url, '_blank')}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedAttachment(null)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 max-h-[calc(90vh-80px)] overflow-auto">
                {isImage(selectedAttachment.type) ? (
                  <img
                    src={selectedAttachment.url}
                    alt={selectedAttachment.name}
                    className="max-w-full h-auto rounded-lg"
                  />
                ) : isVideo(selectedAttachment.type) ? (
                  <video
                    src={selectedAttachment.url}
                    controls
                    className="max-w-full h-auto rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                      {React.createElement(getFileIcon(selectedAttachment.type), {
                        className: "w-8 h-8 text-slate-400"
                      })}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      This file type cannot be previewed
                    </p>
                    <button
                      onClick={() => window.open(selectedAttachment.url, '_blank')}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Download File
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
