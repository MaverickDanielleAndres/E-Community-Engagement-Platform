// @/components/ui/UserHeader.tsx

'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from '@/components/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Search, User, LogOut, Settings, ChevronDown, PlusSquare, FileText } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function UserHeader() {
  const { data: session } = useSession()
  const { isDark, toggleTheme } = useTheme()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [userImage, setUserImage] = useState<string>('')
  const [communityLogo, setCommunityLogo] = useState('')

  const user = session?.user

  // Fetch user image and community logo
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user) return

      try {
        // Fetch user summary
        const userResponse = await fetch('/api/me/summary')
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUserImage(userData.settings?.image || '')
        }

        // Fetch community info
        const communityResponse = await fetch('/api/user/community')
        if (communityResponse.ok) {
          const communityData = await communityResponse.json()
          setCommunityLogo(communityData.logo_url || '')
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }

    fetchUserData()
  }, [session])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log('Searching for:', searchQuery)
    }
  }

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  useEffect(() => {
    if (!session?.user?.email) return

    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/user/notifications')
        const data = await response.json()
        setNotifications(data.notifications || [])
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    }

    fetchNotifications()
  }, [session?.user?.email])

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 px-4 sm:px-6 lg:px-8 py-4"
    >
      <div className="flex items-center justify-between">
        {/* Left: Search and Actions */}
        <div className="flex items-center space-x-4">
          {/* Community Logo */}
          {communityLogo && (
            <img
              src={communityLogo}
              alt="Community Logo"
              className="w-8 h-8 rounded-lg object-cover hidden md:block"
            />
          )}

          {/* Search */}
          <form onSubmit={handleSearch} className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search polls, complaints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-500 dark:placeholder-slate-400"
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
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full bg-red-500"></span>
              )}
            </button>

            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50"
                >
                  <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Notifications</h3>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (!session?.user?.email) return
                        try {
                          const response = await fetch('/api/admin/notifications/mark-read', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                          })
                          if (response.ok) {
                            setNotifications([])
                            setIsNotificationsOpen(false)
                          } else {
                            console.error('Failed to mark notifications as read')
                          }
                        } catch (error) {
                          console.error('Error marking notifications as read:', error)
                        }
                      }}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {notifications.filter(n => !n.is_read).length} unread notifications
                    </p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className={`p-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0 ${!notification.is_read ? (isDark ? 'bg-slate-700/50' : 'bg-blue-50/50') : ''} ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'} transition-colors duration-150`}
                        >
                          <div className="flex items-start space-x-3">
                            <span className="text-lg">ℹ️</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 dark:text-white text-sm">
                                {notification.title}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                {new Date(notification.created_at).toLocaleString()}
                              </p>
                            </div>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                        No notifications
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => {
                        router.push('/main/user/notifications')
                        setIsNotificationsOpen(false)
                      }}
                      className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                {userImage ? (
                  <img
                    src={userImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
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
                  onClick={async () => {
                    setIsProfileOpen(false)
                    await signOut({ callbackUrl: '/' })
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
