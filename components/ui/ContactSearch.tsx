'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, UserPlus, X } from 'lucide-react'

interface Contact {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  status: 'approved' | 'pending' | 'rejected'
}

interface ContactSearchProps {
  onSelectContact: (contact: Contact) => void
  onClose: () => void
  excludeIds?: string[]
}

export function ContactSearch({ onSelectContact, onClose, excludeIds = [] }: ContactSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  useEffect(() => {
    if (searchQuery.length < 2) {
      setContacts([])
      return
    }

    const searchContacts = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/messaging/contacts?search=${encodeURIComponent(searchQuery)}`)
        if (response.ok) {
          const data = await response.json()
          const filteredContacts = data.contacts.filter((contact: Contact) =>
            !excludeIds.includes(contact.id)
          )
          setContacts(filteredContacts)
          setSelectedIndex(-1)
        }
      } catch (error) {
        console.error('Error searching contacts:', error)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchContacts, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery, excludeIds])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (contacts.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, contacts.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < contacts.length) {
          onSelectContact(contacts[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Start New Conversation
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search community members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-slate-500 dark:text-slate-400">
              Searching...
            </div>
          )}

          {!loading && searchQuery.length < 2 && (
            <div className="p-4 text-center text-slate-500 dark:text-slate-400">
              Type at least 2 characters to search
            </div>
          )}

          {!loading && searchQuery.length >= 2 && contacts.length === 0 && (
            <div className="p-4 text-center text-slate-500 dark:text-slate-400">
              No members found
            </div>
          )}

          <AnimatePresence>
            {contacts.map((contact, index) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 border-b border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                  selectedIndex === index ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
                onClick={() => onSelectContact(contact)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    {contact.avatar ? (
                      <img
                        src={contact.avatar}
                        alt={contact.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {contact.name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {contact.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      contact.status === 'approved'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : contact.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {contact.status}
                    </span>
                    <UserPlus className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}
