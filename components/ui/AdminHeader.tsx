// @/components/ui/AdminHeader.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/ThemeContext'
import { useSidebar } from '@/components/ui/SidebarContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import { getSupabaseClient } from '@/lib/supabase'
import { Bell, User, LogOut, Settings, ChevronDown, Mail, Menu, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  message: string
  created_at: string
  is_read: boolean
}

export function AdminHeader() {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  // Removed searchQuery state and related search handlers as per request
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [communityLogo, setCommunityLogo] = useState('')
  const [userImage, setUserImage] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const { data: session } = useSession()
  const { isDark } = useTheme()
  const { isCollapsed, setIsCollapsed } = useSidebar()
  const router = useRouter()

  // Calculate sidebar width for header margin
  const sidebarWidth = isCollapsed ? (isSmallScreen ? 56 : 60) : (isSmallScreen ? 280 : 320)

  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(max-width: 1279px)') // xl breakpoint -1 for tablet/mobile
    setIsSmallScreen(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setIsSmallScreen(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  useEffect(() => {
    if (!session?.user?.email) return

    const supabase = getSupabaseClient()

    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/admin/notifications')
        const data = await response.json()
        setNotifications(data.notifications || [])
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    }

    const fetchCommunityLogo = async () => {
      try {
        const response = await fetch('/api/admin/settings')
        if (response.ok) {
          const data = await response.json()
          setCommunityLogo(data.logo_url || '')
        } else if (response.status === 403) {
          // If forbidden, try to get logo from a public endpoint or skip
          console.warn('Unable to fetch community logo: Admin access required')
        } else {
          console.error('Error fetching community logo:', response.status)
        }
      } catch (error) {
        console.error('Error fetching community logo:', error)
      }
    }

    const fetchUserImage = async () => {
      try {
        const response = await fetch('/api/me/summary')
        if (response.ok) {
          const data = await response.json()
          setUserImage(data.settings?.image || '')
        }
      } catch (error) {
        console.error('Error fetching user image:', error)
      }
    }

    fetchNotifications()
    fetchCommunityLogo()
    fetchUserImage()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('header_notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, (payload) => {
        fetchNotifications() // Refetch on any change
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [session?.user?.email])

  // Listen for sidebar refresh flag
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sidebarRefresh') {
        // Refresh header data immediately
        if (session?.user?.email) {
          const fetchNotifications = async () => {
            try {
              const response = await fetch('/api/admin/notifications')
              const data = await response.json()
              setNotifications(data.notifications || [])
            } catch (error) {
              console.error('Error fetching notifications:', error)
            }
          }

          const fetchCommunityLogo = async () => {
            try {
              const response = await fetch('/api/admin/settings')
              if (response.ok) {
                const data = await response.json()
                setCommunityLogo(data.logo_url || '')
              } else if (response.status === 403) {
                console.warn('Unable to fetch community logo: Admin access required')
              } else {
                console.error('Error fetching community logo:', response.status)
              }
            } catch (error) {
              console.error('Error fetching community logo:', error)
            }
          }

          const fetchUserImage = async () => {
            try {
              const response = await fetch('/api/me/summary')
              if (response.ok) {
                const data = await response.json()
                setUserImage(data.settings?.image || '')
              }
            } catch (error) {
              console.error('Error fetching user image:', error)
            }
          }

          fetchNotifications()
          fetchCommunityLogo()
          fetchUserImage()
        }
      }
    }

    const handleCustomEvent = () => {
      // Refresh header data immediately
      if (session?.user?.email) {
        const fetchNotifications = async () => {
          try {
            const response = await fetch('/api/admin/notifications')
            const data = await response.json()
            setNotifications(data.notifications || [])
          } catch (error) {
            console.error('Error fetching notifications:', error)
          }
        }

        const fetchCommunityLogo = async () => {
          try {
            const response = await fetch('/api/admin/settings')
            if (response.ok) {
              const data = await response.json()
              setCommunityLogo(data.logo_url || '')
            } else if (response.status === 403) {
              console.warn('Unable to fetch community logo: Admin access required')
            } else {
              console.error('Error fetching community logo:', response.status)
            }
          } catch (error) {
            console.error('Error fetching community logo:', error)
          }
        }

        const fetchUserImage = async () => {
          try {
            const response = await fetch('/api/me/summary')
            if (response.ok) {
              const userData = await response.json()
              setUserImage(userData.settings?.image || '')
            }
          } catch (error) {
            console.error('Error fetching user image:', error)
          }
        }

        fetchNotifications()
        fetchCommunityLogo()
        fetchUserImage()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('sidebarRefresh', handleCustomEvent)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('sidebarRefresh', handleCustomEvent)
    }
  }, [session?.user?.email])

  const handleRefresh = async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    try {
      // Refresh notifications
      const response = await fetch('/api/admin/notifications')
      const data = await response.json()
      setNotifications(data.notifications || [])

      // Refresh community logo
      const logoResponse = await fetch('/api/admin/settings')
      if (logoResponse.ok) {
        const logoData = await logoResponse.json()
        setCommunityLogo(logoData.logo_url || '')
      }

      // Refresh user image
      const userResponse = await fetch('/api/me/summary')
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUserImage(userData.settings?.image || '')
      }

      // Trigger sidebar refresh for both AdminSidebar and UserSidebar
      localStorage.setItem('sidebarRefresh', 'true')
      // Dispatch storage event to trigger immediate refresh
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'sidebarRefresh',
        newValue: 'true'
      }))
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSignOut = async () => {
    const { signOut } = await import('next-auth/react')
    await signOut({ callbackUrl: '/' })
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
      style={{ marginLeft: isSmallScreen && isCollapsed ? `${sidebarWidth}px` : '0px' }}
      className={`
        sticky top-0 z-20 border-b backdrop-blur-md transition-all duration-300
        ${isDark
          ? 'bg-slate-900/80 border-slate-700'
          : 'bg-white/80 border-slate-200'
        }
      `}
    >
      <div className={`flex items-center justify-between ${isSmallScreen ? 'px-4 py-3' : 'px-6 py-4'}`}>
        {/* Left Section */}
        <div className="flex items-center space-x-4 ml-13">
          <div className="hidden lg:block">
            <div className="flex items-center space-x-3 ">
              {communityLogo && (
                <img
                  src={communityLogo}
                  alt="Community Logo"
                  className="w-10 h-10 rounded-lg object-cover"
                />
              )}
              <div>
                <h1 className={`${isSmallScreen ? 'text-xl' : 'text-2xl'} font-bold text-slate-900 dark:text-white`}>
                  Admin Dashboard
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Welcome back, {session?.user?.name || 'Administrator'}
                </p>
              </div>
            </div>
          </div>
        </div>



        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`
              p-2.5 rounded-xl transition-all duration-200
              ${isDark
                ? 'hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-50'
                : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900 disabled:opacity-50'
              }
            `}
            title="Refresh data"
          >
            <RotateCcw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

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
              <div className="w-8 h-8 rounded-full overflow-hidden">
                {userImage ? (
                  <img
                    src={userImage}
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : communityLogo ? (
                  <img
                    src={communityLogo}
                    alt="Community Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full font-semibold text-sm">
                    {session?.user?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                )}
              </div>
              <div className="hidden sm:block text-left min-w-0 flex-1 max-w-[150px]">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
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
                    absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl border z-50
                    ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}
                  `}
                >
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        {userImage ? (
                          <img
                            src={userImage}
                            alt="User Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : communityLogo ? (
                          <img
                            src={communityLogo}
                            alt="Community Logo"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full font-semibold">
                            {session?.user?.name?.charAt(0)?.toUpperCase() || 'A'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {session?.user?.name || 'Administrator'}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
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

            {/* Notifications Modal positioned below profile name */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`
                    absolute right-0 mt-2 w-64 sm:w-80 rounded-2xl shadow-2xl border z-50
                    ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}
                  `}
                >
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Notifications
                    </h3>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (!session?.user?.email) return
                        try {
                          const response = await fetch('/api/admin/notifications?clear=true', {
                            method: 'DELETE'
                          })
                          if (response.ok) {
                            // Clear the notifications list locally
                            setNotifications([])
                            setShowNotifications(false)
                          } else {
                            console.error('Failed to clear notifications')
                          }
                        } catch (error) {
                          console.error('Error clearing notifications:', error)
                        }
                      }}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700">
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
                          ${!notification.is_read ? (isDark ? 'bg-slate-700/50' : 'bg-blue-50/50') : ''}
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
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => {
                        router.push('/main/admin/notifications')
                        setShowNotifications(false)
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
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showNotifications || showUserMenu) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            if (showNotifications) setShowNotifications(false)
            if (showUserMenu) setShowUserMenu(false)
          }}
        />
      )}
    </motion.header>
  )
}
