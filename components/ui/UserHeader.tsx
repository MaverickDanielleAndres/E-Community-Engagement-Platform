// @/components/ui/UserHeader.tsx
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTheme } from '@/components/ThemeContext'
import { motion } from 'framer-motion'
import { Bell, Search, User, LogOut, Settings, Menu, ChevronDown, PlusSquare, FileText } from 'lucide-react'
import Link from 'next/link'

export function UserHeader() {
  const { data: session } = useSession()
  const { isDark, toggleTheme } = useTheme()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const user = session?.user

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log('Searching for:', searchQuery)
    }
  }

  const notifications = [
    { id: 1, title: 'New poll available', type: 'info', time: '2 min ago' },
    { id: 2, title: 'Your complaint has been resolved', type: 'success', time: '1 hour ago' },
    { id: 3, title: 'Community update', type: 'info', time: '3 hours ago' }
  ]

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`
        bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700
        sticky top-0 z-20 px-4 sm:px-6 lg:px-8 py-4
      `}
    >
      <div className="flex items-center justify-between">
        {/* Left: Search and Actions */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search polls, complaints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`
                pl-10 pr-4 py-2 w-64 rounded-xl border border-slate-200 dark:border-slate-700
                bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                placeholder-slate-500 dark:placeholder-slate-400
              `}
            />
          </form>

          {/* Quick Actions */}
          <div className="hidden md:flex items-center space-x-2">
            <button className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <PlusSquare className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <FileText className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right: User Actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full bg-red-500"></span>
              )}
            </button>

            {isNotificationsOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50"
              >
                <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <Link
                      key={notification.id}
                      href="#"
                      className="block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                          notification.type === 'success' ? 'bg-green-500' :
                          notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {notification.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                {notifications.length === 0 && (
                  <div className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                    No notifications
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2 p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              {!isProfileOpen && (
                <span className="hidden sm:inline text-sm font-medium text-slate-900 dark:text-white">
                  {user?.name || user?.email?.split('@')[0] || 'User'}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50"
              >
                <Link
                  href="/main/user/settings"
                  className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Profile Settings
                </Link>
                <hr className="my-1 border-slate-200 dark:border-slate-700" />
                <button
                  onClick={() => {
                    // Implement logout
                    window.location.href = '/api/auth/signout'
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  )
}
