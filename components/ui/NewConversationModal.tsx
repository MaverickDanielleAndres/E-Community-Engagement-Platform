'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Users, Check } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useTheme } from '@/components/ThemeContext'

interface Member {
  id: string
  name: string
  email: string
  avatar_url?: string
  status?: string
  last_seen_at?: string
  has_conversation?: boolean
  conversation_id?: string
}

interface NewConversationModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateConversation: (memberIds: string[], isGroup?: boolean) => Promise<void>
}

export function NewConversationModal({
  isOpen,
  onClose,
  onCreateConversation
}: NewConversationModalProps) {
  const { isDark } = useTheme()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)

  // Fetch members when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchMembers()
    } else {
      // Reset state when closing
      setSelectedMembers(new Set())
      setSearchQuery('')
    }
  }, [isOpen])

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/messaging/contacts')
      if (response.ok) {
        const data = await response.json()
        setMembers(data.contacts || [])
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(memberId)) {
        newSet.delete(memberId)
      } else {
        newSet.add(memberId)
      }
      return newSet
    })
  }

  const handleCreateConversation = async () => {
    if (selectedMembers.size === 0) return

    setCreating(true)
    try {
      const isGroup = selectedMembers.size > 1
      await onCreateConversation(Array.from(selectedMembers), isGroup)
      onClose()
    } catch (error) {
      console.error('Error creating conversation:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleExistingConversation = (conversationId: string) => {
    // Navigate to existing conversation
    window.location.href = `/main/user/messaging?conversation=${conversationId}`
    onClose()
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
              <h2 className={`text-xl font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Users className="w-5 h-5" />
                Start New Conversation
              </h2>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-white hover:bg-slate-50 text-slate-900'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  {searchQuery ? 'No members found matching your search.' : 'No members available.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMembers.map((member) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedMembers.has(member.id)
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                          : `border-slate-200 dark:border-slate-700 ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-50'}`
                      }`}
                      onClick={() => {
                        if (member.has_conversation) {
                          handleExistingConversation(member.conversation_id!)
                        } else {
                          handleMemberToggle(member.id)
                        }
                      }}
                    >
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        {/* Selection indicator */}
                        {selectedMembers.has(member.id) && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Member info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{member.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{member.email}</p>
                        {member.has_conversation && (
                          <p className="text-xs text-blue-500 mt-1">Already have a conversation</p>
                        )}
                      </div>

                      {/* Status */}
                      <div className="text-right">
                        <div className={`w-2 h-2 rounded-full ${
                          member.status === 'online' ? 'bg-green-500' : 'bg-slate-400'
                        }`} />
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {member.status === 'online' ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {selectedMembers.size > 0 && (
              <div className="p-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedMembers.size} member{selectedMembers.size > 1 ? 's' : ''} selected
                  </p>
                  <button
                    onClick={handleCreateConversation}
                    disabled={creating}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {creating ? <LoadingSpinner /> : null}
                    Start Conversation
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
