'use client'

import { useState, useEffect } from 'react'
import { X, Bell, BellOff, Edit3, Users } from 'lucide-react'

interface ConversationSettings {
  customTitle?: string
  isMuted: boolean
  muteUntil?: string
}

interface ConversationSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  conversationId: string
  currentTitle: string
  participants: Array<{ id: string; name: string }>
  onSave: (settings: ConversationSettings) => Promise<void>
}

export function ConversationSettingsModal({
  isOpen,
  onClose,
  conversationId,
  currentTitle,
  participants,
  onSave
}: ConversationSettingsModalProps) {
  const [settings, setSettings] = useState<ConversationSettings>({
    customTitle: currentTitle,
    isMuted: false,
    muteUntil: undefined
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Load current settings
      setSettings({
        customTitle: currentTitle,
        isMuted: false, // TODO: Load from API
        muteUntil: undefined
      })
    }
  }, [isOpen, currentTitle])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await onSave(settings)
      onClose()
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMute = () => {
    setSettings(prev => ({
      ...prev,
      isMuted: !prev.isMuted,
      muteUntil: !prev.isMuted ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined // 24 hours
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold">Conversation Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Participants */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Participants
            </h3>
            <div className="space-y-2">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {participant.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm">{participant.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Title */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Custom Title
            </h3>
            <input
              type="text"
              value={settings.customTitle || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, customTitle: e.target.value }))}
              placeholder="Enter custom title..."
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Notifications */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Notifications
            </h3>
            <button
              onClick={toggleMute}
              className={`flex items-center gap-3 w-full p-3 rounded-lg border transition-colors ${
                settings.isMuted
                  ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                  : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {settings.isMuted ? (
                <BellOff className="w-5 h-5 text-red-500" />
              ) : (
                <Bell className="w-5 h-5 text-green-500" />
              )}
              <div className="text-left">
                <p className="text-sm font-medium">
                  {settings.isMuted ? 'Muted' : 'Notifications enabled'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {settings.isMuted ? 'You won\'t receive notifications for this conversation' : 'You\'ll receive notifications for new messages'}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
