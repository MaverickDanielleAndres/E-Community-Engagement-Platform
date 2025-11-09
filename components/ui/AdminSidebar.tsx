// @/components/ui/AdminSidebar.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useTheme } from '@/components/ThemeContext'
import { useSidebar } from '@/components/ui/SidebarContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Bot, BarChart3, Users, MessageSquareWarning,
  Smile, PlusSquare, ScrollText, Bell, Settings,
  ChevronLeft, ChevronRight, Target, ShieldCheck, Megaphone
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
}

interface NavSection {
  title: string
  items: NavItem[]
}

export function AdminSidebar() {
  const { isCollapsed, setIsCollapsed } = useSidebar()
  const { isDark } = useTheme()
  const { data: session } = useSession()
  const pathname = usePathname()

  // Check if mobile/tablet screens using matchMedia for better reliability (default collapsed below xl)
  const [isSmallScreen, setIsSmallScreen] = useState(false)

  // Use isCollapsed directly, no forcing
  const effectiveIsCollapsed = isCollapsed

  // Dynamic badge counts
  const [complaintCount, setComplaintCount] = useState(0)
  const [notificationCount, setNotificationCount] = useState(0)

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

  // Fetch dynamic counts
  useEffect(() => {
    if (!session?.user?.email) return

    let intervalId: NodeJS.Timeout

    const fetchCounts = async () => {
      try {
        // Fetch complaints count (total pending/unresolved)
        const complaintsResponse = await fetch('/api/complaints?status=pending')
        if (complaintsResponse.ok) {
          const complaintsData = await complaintsResponse.json()
          setComplaintCount(complaintsData.complaints?.length || 0)
        }

        // Fetch notifications count (unread)
        const notificationsResponse = await fetch('/api/admin/notifications')
        if (notificationsResponse.ok) {
          const notificationsData = await notificationsResponse.json()
          const unread = notificationsData.notifications?.filter((n: any) => !n.is_read).length || 0
          setNotificationCount(unread)
        }
      } catch (error) {
        console.error('Error fetching counts:', error)
      }
    }

    fetchCounts()

    // Poll every 30 seconds for updates
    intervalId = setInterval(fetchCounts, 30000)

    return () => {
      clearInterval(intervalId)
    }
  }, [session?.user?.email])

  // Real-time notifications subscription
  useEffect(() => {
    if (!session?.user?.id) return

    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const channel = supabase
      .channel('admin_sidebar_notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, () => {
        // Refresh notification count when notifications change
        const fetchNotificationCount = async () => {
          try {
            const notificationsResponse = await fetch('/api/admin/notifications')
            if (notificationsResponse.ok) {
              const notificationsData = await notificationsResponse.json()
              const unread = notificationsData.notifications?.filter((n: any) => !n.is_read).length || 0
              setNotificationCount(unread)
            }
          } catch (error) {
            console.error('Error fetching notification count:', error)
          }
        }
        fetchNotificationCount()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.user?.id])

  // Listen for sidebar refresh flag
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sidebarRefresh') {
        // Refresh counts immediately
        if (session?.user?.email) {
          const fetchCounts = async () => {
            try {
              // Fetch complaints count (total pending/unresolved)
              const complaintsResponse = await fetch('/api/complaints?status=pending')
              if (complaintsResponse.ok) {
                const complaintsData = await complaintsResponse.json()
                setComplaintCount(complaintsData.complaints?.length || 0)
              }

              // Fetch notifications count (unread)
              const notificationsResponse = await fetch('/api/admin/notifications')
              if (notificationsResponse.ok) {
                const notificationsData = await notificationsResponse.json()
                const unread = notificationsData.notifications?.filter((n: any) => !n.is_read).length || 0
                setNotificationCount(unread)
              }
            } catch (error) {
              console.error('Error fetching counts:', error)
            }
          }
          fetchCounts()
        }
      }
    }

    const handleCustomEvent = () => {
      // Refresh counts immediately
      if (session?.user?.email) {
        const fetchCounts = async () => {
          try {
            // Fetch complaints count (total pending/unresolved)
            const complaintsResponse = await fetch('/api/complaints?status=pending')
            if (complaintsResponse.ok) {
              const complaintsData = await complaintsResponse.json()
              setComplaintCount(complaintsData.complaints?.length || 0)
            }

            // Fetch notifications count (unread)
            const notificationsResponse = await fetch('/api/admin/notifications')
            if (notificationsResponse.ok) {
              const notificationsData = await notificationsResponse.json()
              const unread = notificationsData.notifications?.filter((n: any) => !n.is_read).length || 0
              setNotificationCount(unread)
            }
          } catch (error) {
            console.error('Error fetching counts:', error)
          }
        }
        fetchCounts()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('sidebarRefresh', handleCustomEvent)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('sidebarRefresh', handleCustomEvent)
    }
  }, [session?.user?.email])

  const navigationSections: NavSection[] = [
    {
      title: "Overview",
      items: [
        { label: "Dashboard", href: "/main/admin", icon: LayoutDashboard },
        { label: "AI Insights", href: "/main/admin/ai-insights", icon: Bot },
        { label: "Analytics", href: "/main/admin/analytics", icon: BarChart3 }
      ]
    },
      {
        title: "Management",
        items: [
          { label: "Members", href: "/main/admin/members", icon: Users },
          { label: "Requests", href: "/main/admin/requests", icon: ShieldCheck },
          { label: "Complaints", href: "/main/admin/complaints", icon: MessageSquareWarning, badge: complaintCount },
          { label: "Feedback", href: "/main/admin/feedback", icon: Smile },
          { label: "Polls", href: "/main/admin/polls", icon: PlusSquare },
          { label: "Announcements", href: "/main/admin/announcements", icon: Megaphone }
        ]
      },
    {
      title: "System",
      items: [
        { label: "Audit Log", href: "/main/admin/audit-log", icon: ScrollText },
        { label: "Notifications", href: "/main/admin/notifications", icon: Bell, badge: notificationCount },
        { label: "Settings", href: "/main/admin/settings", icon: Settings }
      ]
    }
  ]

  const NavItemComponent = ({ item, isCollapsed }: { item: NavItem; isCollapsed: boolean }) => {
    const isActive = pathname === item.href
    const Icon = item.icon

  const handleNavClick = () => {
    // Auto-collapse sidebar on small screens when navigation link is clicked
    if (isSmallScreen) {
      setIsCollapsed(true)
    }
  }

    return (
      <Link href={item.href} onClick={handleNavClick}>
        <motion.div
          whileHover={{ x: effectiveIsCollapsed ? 4 : 2, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            relative flex items-center justify-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group
            ${isActive
              ? `${isDark ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 shadow-lg shadow-blue-500/10' : 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 shadow-lg shadow-blue-500/10'} border border-blue-200/50 dark:border-blue-500/30`
              : `${isDark ? 'text-slate-300 hover:bg-gradient-to-r hover:from-slate-800/50 hover:to-slate-700/50 hover:text-white hover:shadow-md' : 'text-slate-600 hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-50 hover:text-slate-900 hover:shadow-md'}`
            }
          `}
        >
          {isActive && (
            <motion.div
              layoutId="active-pill"
              className={`absolute left-0 top-0 bottom-0 w-1 rounded-r-full ${isDark ? 'bg-blue-400' : 'bg-blue-600'}`}
              initial={false}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}

          <div className={`flex-shrink-0 ${isActive ? (isDark ? 'text-blue-400' : 'text-blue-600') : ''}`}>
            <Icon size={isSmallScreen ? 16 : 20} />
          </div>

          <AnimatePresence>
            {!effectiveIsCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between flex-1 min-w-0"
              >
                <span className="font-medium text-sm truncate">{item.label}</span>
                {item.badge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`
                      px-1.5 py-0.5 text-xs font-semibold rounded-full
                      ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'}
                    `}
                  >
                    {item.badge}
                  </motion.span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </Link>
    )
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`flex items-center justify-between ${effectiveIsCollapsed ? 'p-1' : 'p-4'} border-b border-slate-200 dark:border-slate-700`}>
        <AnimatePresence>
          {!effectiveIsCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                EComAI
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Admin Panel</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle button - always visible */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsCollapsed(!isCollapsed)
          }}
          className={`
            p-3 rounded-lg transition-all duration-200 hover:scale-110 z-50 relative
            ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}
            border ${isDark ? 'border-slate-600' : 'border-slate-300'}
          `}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {effectiveIsCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-4">
        {navigationSections.map((section, sectionIndex) => (
          <div key={section.title}>
            <AnimatePresence>
              {!effectiveIsCollapsed && (
                <motion.h3
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: sectionIndex * 0.1 }}
                  className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3"
                >
                  {section.title}
                </motion.h3>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              {section.items.map((item, itemIndex) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: (sectionIndex * 0.1) + (itemIndex * 0.05) }}
                >
                  <NavItemComponent item={item} isCollapsed={effectiveIsCollapsed} />
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <AnimatePresence>
          {!effectiveIsCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className={`
                p-3 rounded-xl text-center
                ${isDark ? 'bg-gradient-to-r from-slate-800 to-slate-700' : 'bg-gradient-to-r from-slate-100 to-slate-50'}
              `}
            >
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )

  // Always render the sidebar, no mobile drawer
  return (
    <motion.aside
      initial={false}
      animate={{
        width: isCollapsed ? (isSmallScreen ? 56 : 60) : (isSmallScreen ? 280 : 320),
        x: 0
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`
        fixed left-0 top-0 bottom-0 z-30
        ${isDark ? 'bg-slate-900/95' : 'bg-white/95'}
        backdrop-blur-sm border-r border-slate-200 dark:border-slate-700
      `}
    >
      {sidebarContent}
    </motion.aside>
  )
}
