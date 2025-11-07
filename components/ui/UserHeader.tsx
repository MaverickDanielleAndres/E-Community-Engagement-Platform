// @/components/ui/UserHeader.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from '@/components/ThemeContext'
import { useToast } from '@/components/ToastContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, User, LogOut, Settings, ChevronDown, PlusSquare, FileText, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Notification } from '@/types/notification'
import { getSupabaseClient } from '@/lib/supabase'
import { refreshHeaderAndSidebar } from '@/components/utils/refresh'

export function UserHeader() {
  const { data: session } = useSession()
  const { isDark, toggleTheme } = useTheme()
  const { showToast } = useToast()
  const router = useRouter()
  // Removed searchQuery state and related
  const [userImage, setUserImage] = useState<string>('')
  const [communityLogo, setCommunityLogo] = useState('')

  const user = session?.user

  // Fetch user image and community logo
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user) return

      try {
        const userResponse = await fetch('/api/me/summary')
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUserImage(userData.settings?.image || '')
        }

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

  // Load nickname from localStorage
  useEffect(() => {
    const storedNickname = localStorage.getItem('userNickname')
    if (storedNickname) {
      setNickname(storedNickname)
    }
  }, [])



  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false)
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false)
  const [newNickname, setNewNickname] = useState('')
  const [sentMessageColor, setSentMessageColor] = useState('#3b82f6')
  const [receivedMessageColor, setReceivedMessageColor] = useState('#374151')
  const [nickname, setNickname] = useState('')

  const notificationsRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  // Refresh function to refetch header data and trigger sidebar refresh
  const handleRefresh = async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    try {
      // Refetch notifications
      const notificationsResponse = await fetch('/api/notifications')
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json()
        setNotifications(notificationsData.notifications || [])
      }

      // Refetch user data
      const userResponse = await fetch('/api/me/summary')
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUserImage(userData.settings?.image || '')
      }

      const communityResponse = await fetch('/api/user/community')
      if (communityResponse.ok) {
        const communityData = await communityResponse.json()
        setCommunityLogo(communityData.logo_url || '')
      }

      // Use shared refresh function for sidebar
      await refreshHeaderAndSidebar()
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (!session?.user?.email) return

    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications')
        const data = await response.json()
        setNotifications(data.notifications || [])
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    }

    fetchNotifications()

    // Setup Supabase real-time subscription for notifications
    const supabase = getSupabaseClient()
    const channel = supabase
      .channel('user_notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user?.id}` }, (payload) => {
        fetchNotifications() // Refetch notifications on any change

        // Show toast for new notifications
        if (payload.eventType === 'INSERT') {
          const newNotification = payload.new as Notification
          showToast(`New notification: ${newNotification.title}`, 'info')
        }
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [session?.user?.email, showToast])

  // Listen for header refresh events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sidebarRefresh' && e.newValue === 'true') {
        localStorage.removeItem('sidebarRefresh')
        // Refresh header data
        const refreshHeaderData = async () => {
          try {
            // Refetch notifications
            const notificationsResponse = await fetch('/api/notifications')
            if (notificationsResponse.ok) {
              const notificationsData = await notificationsResponse.json()
              setNotifications(notificationsData.notifications || [])
            }

            // Refetch user data
            const userResponse = await fetch('/api/me/summary')
            if (userResponse.ok) {
              const userData = await userResponse.json()
              setUserImage(userData.settings?.image || '')
            }

            const communityResponse = await fetch('/api/user/community')
            if (communityResponse.ok) {
              const communityData = await communityResponse.json()
              setCommunityLogo(communityData.logo_url || '')
            }
          } catch (error) {
            console.error('Error refreshing header data:', error)
          }
        }
        refreshHeaderData()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`backdrop-blur-md border-b sticky top-0 z-20 px-4 sm:px-6 lg:px-8 py-4 ${
        isDark 
          ? 'bg-slate-900 border-slate-700' 
          : 'bg-white border-slate-200'
      }`}
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
        </div>

        {/* Right: User Actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`relative p-2 transition-colors hover:bg-${isDark ? 'white/10' : 'slate-100'} ${
              isDark
                ? 'text-slate-300 hover:text-blue-400'
                : 'text-slate-600 hover:text-blue-600'
            }`}
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
                  className={`absolute right-0 mt-2 w-80 rounded-xl shadow-lg border py-2 z-50 ${
                    isDark
                      ? 'bg-slate-800 border-slate-700'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className={`px-4 py-2 border-b flex items-center justify-between ${
                    isDark ? 'border-slate-700' : 'border-slate-200'
                  }`}>
                    <h3 className={`font-semibold text-sm ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>Notifications</h3>
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
                  <div className={`p-4 border-b ${
                    isDark ? 'border-slate-700' : 'border-slate-200'
                  }`}>
                    <p className={`text-sm ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
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
                          className={`p-4 border-b last:border-b-0 ${
                            !notification.is_read 
                              ? isDark ? 'bg-slate-700/50' : 'bg-blue-50/50'
                              : ''
                          } ${
                            isDark 
                              ? 'hover:bg-slate-700 border-slate-700' 
                              : 'hover:bg-slate-50 border-slate-200'
                          } transition-colors duration-150`}
                        >
                          <div className="flex items-start space-x-3">
                            <span className="text-lg">ℹ️</span>
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium text-sm ${
                                isDark ? 'text-white' : 'text-slate-900'
                              }`}>
                                {notification.title}
                              </p>
                              <p className={`text-xs mt-1 ${
                                isDark ? 'text-slate-400' : 'text-slate-500'
                              }`}>
                                {notification.body}
                              </p>
                              <p className={`text-xs mt-1 ${
                                isDark ? 'text-slate-500' : 'text-slate-400'
                              }`}>
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
                      <div className={`px-4 py-6 text-center ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        No notifications
                      </div>
                    )}
                  </div>
                  <div className={`p-3 border-t ${
                    isDark ? 'border-slate-700' : 'border-slate-200'
                  }`}>
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

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2 transition-colors rounded-lg hover:bg-${isDark ? 'white/10' : 'slate-100'} ${
              isRefreshing
                ? 'opacity-50 cursor-not-allowed'
                : isDark
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Refresh header and sidebar"
          >
            <RotateCcw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 transition-colors rounded-lg hover:bg-${isDark ? 'white/10' : 'slate-100'} ${
              isDark
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
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
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`flex items-center space-x-2 p-2 transition-colors rounded-lg hover:bg-${isDark ? 'white/10' : 'slate-100'} ${
                isDark
                  ? 'text-slate-300 hover:text-blue-400'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
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
                <span className={`hidden sm:inline text-sm font-medium ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {nickname || user?.name || user?.email?.split('@')[0] || 'User'}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg border py-1 z-50 ${
                  isDark
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-white border-slate-200'
                }`}
              >
                <Link
                  href="/main/user/settings"
                  className={`flex items-center px-4 py-2 text-sm transition-colors ${
                    isDark
                      ? 'text-slate-300 hover:bg-slate-700/50'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  onClick={() => setIsProfileOpen(false)}
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Profile Settings
                </Link>
                <div className={`px-4 py-2 text-sm ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  <span className="font-medium">Current Nickname:</span> {nickname || user?.name || user?.email?.split('@')[0] || 'User'}
                </div>
                <button
                  onClick={() => {
                    setIsProfileOpen(false)
                    setIsNicknameModalOpen(true)
                  }}
                  className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${
                    isDark
                      ? 'text-slate-300 hover:bg-slate-700/50'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-4 h-4 mr-3" />
                  Change Nickname
                </button>
                <button
                  onClick={() => {
                    setIsProfileOpen(false)
                    setIsThemeModalOpen(true)
                  }}
                  className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${
                    isDark
                      ? 'text-slate-300 hover:bg-slate-700/50'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                  </svg>
                  Theme
                </button>
                <hr className={`my-1 ${
                  isDark ? 'border-slate-700' : 'border-slate-200'
                }`} />
                <button
                  onClick={async () => {
                    setIsProfileOpen(false)
                    await signOut({ callbackUrl: '/' })
                  }}
                  className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${
                    isDark
                      ? 'text-red-400 hover:bg-red-900/20'
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Nickname Change Modal */}
      <AnimatePresence>
        {isNicknameModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setIsNicknameModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-96 p-6 rounded-xl shadow-xl ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
              } border`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={`text-lg font-semibold mb-4 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Change Nickname
              </h3>
              <input
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                placeholder="Enter new nickname"
                className={`w-full px-3 py-2 rounded-lg border mb-4 ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                }`}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsNicknameModalOpen(false)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isDark
                      ? 'text-slate-300 hover:bg-slate-700'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newNickname.trim()) {
                      localStorage.setItem('userNickname', newNickname.trim())
                      setNickname(newNickname.trim())
                      setIsNicknameModalOpen(false)
                      setNewNickname('')
                      showToast('Nickname updated successfully!', 'success')
                      // Trigger refresh to update display
                      handleRefresh()
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Theme Modal */}
      <AnimatePresence>
        {isThemeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setIsThemeModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-96 p-6 rounded-xl shadow-xl ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
              } border`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={`text-lg font-semibold mb-4 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Message Theme
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Sent Message Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={sentMessageColor}
                      onChange={(e) => setSentMessageColor(e.target.value)}
                      className="w-12 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <span className={`text-sm ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {sentMessageColor}
                    </span>
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Received Message Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={receivedMessageColor}
                      onChange={(e) => setReceivedMessageColor(e.target.value)}
                      className="w-12 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <span className={`text-sm ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {receivedMessageColor}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setIsThemeModalOpen(false)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isDark
                      ? 'text-slate-300 hover:bg-slate-700'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('sentMessageColor', sentMessageColor)
                    localStorage.setItem('receivedMessageColor', receivedMessageColor)
                    setIsThemeModalOpen(false)
                    showToast('Message theme updated!', 'success')
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
