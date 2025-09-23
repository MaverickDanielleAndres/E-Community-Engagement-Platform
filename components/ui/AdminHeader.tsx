// @/components/ui/AdminHeader.tsx
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/ThemeContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Bell, Search, User, LogOut, Settings, ChevronDown, Mail } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  message: string
  time: string
  unread: boolean
}

export function AdminHeader() {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { data: session } = useSession()
  const { isDark } = useTheme()
  const router = useRouter()

  // Mock notifications - replace with real data
  const notifications: Notification[] = [
    {
      id: '1',
      type: 'warning',
      title: 'High Complaint Volume',
      message: 'Unusual spike in complaints detected',
      time: '5m ago',
      unread: true
    },
    {
      id: '2',
      type: 'success',
      title: 'Poll Completed',
      message: 'Community Garden poll has ended',
      time: '1h ago',
      unread: true
    },
    {
      id: '3',
      type: 'info',
      title: 'New Member',
      message: 'John Doe joined the community',
      time: '2h ago',
      unread: false
    }
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  const handleSignOut = async () => {
    const { signOut } = await import('next-auth/react')
    await signOut({ redirect: false })
    router.push('/')
  }

  const getNotificationIcon = (type: string) => {
    const icons = {
      info: 'ℹ️',
      warning: '⚠️',
      success: '✅',
      error: '❌'
    }
    return icons[type as keyof typeof icons] || 'ℹ️'
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`
        sticky top-0 z-40 border-b backdrop-blur-md
        ${isDark 
          ? 'bg-slate-900/80 border-slate-700' 
          : 'bg-white/80 border-slate-200'
        }
      `}
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Welcome back, {session?.user?.name || 'Administrator'}
            </p>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-md mx-8 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members, complaints, polls..."
              className={`
                w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${isDark 
                  ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-400' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-500'
                }
              `}
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <ThemeToggle className="hidden sm:block" />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`
                relative p-2.5 rounded-xl transition-all duration-200
                ${isDark 
                  ? 'hover:bg-slate-800 text-slate-300 hover:text-white' 
                  : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                }
              `}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold"
                >
                  {unreadCount}
                </motion.span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`
                    absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl border z-50
                    ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}
                  `}
                >
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Notifications
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {unreadCount} unread notifications
                    </p>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className={`
                          p-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0
                          ${notification.unread ? (isDark ? 'bg-slate-700/50' : 'bg-blue-50/50') : ''}
                          hover:${isDark ? 'bg-slate-700' : 'bg-slate-50'} transition-colors duration-150
                        `}
                      >
                        <div className="flex items-start space-x-3">
                          <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 dark:text-white text-sm">
                              {notification.title}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                              {notification.time}
                            </p>
                          </div>
                          {notification.unread && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                    <button className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`
                flex items-center space-x-2 p-2 rounded-xl transition-all duration-200
                ${isDark 
                  ? 'hover:bg-slate-800 text-slate-300' 
                  : 'hover:bg-slate-100 text-slate-600'
                }
              `}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm
                ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}
              `}>
                {session?.user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {session?.user?.name || 'Administrator'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Admin</p>
              </div>
              <ChevronDown className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`
                    absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl border z-50
                    ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}
                  `}
                >
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center space-x-3">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-semibold
                        ${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}
                      `}>
                        {session?.user?.name?.charAt(0)?.toUpperCase() || 'A'}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {session?.user?.name || 'Administrator'}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {session?.user?.email || 'admin@example.com'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    <button
                      onClick={() => router.push('/main/admin/settings')}
                      className={`
                        w-full flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors duration-150
                        ${isDark 
                          ? 'text-slate-300 hover:bg-slate-700 hover:text-white' 
                          : 'text-slate-700 hover:bg-slate-100'
                        }
                      `}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    
                    <button
                      onClick={() => window.open(`mailto:${session?.user?.email}`, '_blank')}
                      className={`
                        w-full flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors duration-150
                        ${isDark 
                          ? 'text-slate-300 hover:bg-slate-700 hover:text-white' 
                          : 'text-slate-700 hover:bg-slate-100'
                        }
                      `}
                    >
                      <Mail className="w-4 h-4" />
                      <span>Contact Support</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-700 py-2">
                    <button
                      onClick={handleSignOut}
                      className={`
                        w-full flex items-center space-x-3 px-4 py-2.5 text-sm transition-colors duration-150
                        ${isDark 
                          ? 'text-red-400 hover:bg-red-900/20' 
                          : 'text-red-600 hover:bg-red-50'
                        }
                      `}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showNotifications || showUserMenu) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowNotifications(false)
            setShowUserMenu(false)
          }}
        />
      )}
    </motion.header>
  )
}