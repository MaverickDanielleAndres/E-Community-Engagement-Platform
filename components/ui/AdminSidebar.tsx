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
  ChevronLeft, Target
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
  const { isCollapsed, toggleSidebar, isOpen, setIsOpen, setIsCollapsed } = useSidebar()
  const { isDark } = useTheme()
  const { data: session } = useSession()
  const pathname = usePathname()

  // Check if mobile screens
  const [isMobile, setIsMobile] = useState(false)

  // Force expanded sidebar on mobile/tablet
  const effectiveIsCollapsed = isMobile ? false : isCollapsed

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }

    // Check on mount
    checkScreenSize()

    // Add resize listener
    window.addEventListener('resize', checkScreenSize)

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Close sidebar when navigating to a new page on mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      // Close sidebar when pathname changes
      const handleRouteChange = () => {
        if (isOpen) {
          // We'll need to import setIsOpen from the context
          // For now, we'll use a timeout to close it
          setTimeout(() => {
            if (isOpen) {
              // This will be handled by the navigation link click
            }
          }, 100)
        }
      }

      // Listen for route changes
      window.addEventListener('popstate', handleRouteChange)

      return () => window.removeEventListener('popstate', handleRouteChange)
    }
  }, [pathname, isMobile, isOpen])

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
        { label: "Complaints", href: "/main/admin/complaints", icon: MessageSquareWarning, badge: 3 },
        { label: "Feedback", href: "/main/admin/feedback", icon: Smile },
        { label: "Polls", href: "/main/admin/polls", icon: PlusSquare }
      ]
    },
    {
      title: "System",
      items: [
        { label: "Audit Log", href: "/main/admin/audit-log", icon: ScrollText },
        { label: "Notifications", href: "/main/admin/notifications", icon: Bell, badge: 5 },
        { label: "Settings", href: "/main/admin/settings", icon: Settings }
      ]
    }
  ]

  const NavItemComponent = ({ item, isCollapsed }: { item: NavItem; isCollapsed: boolean }) => {
    const isActive = pathname === item.href
    const Icon = item.icon

    const handleNavClick = () => {
      // Close sidebar on mobile when navigation link is clicked
      if (isMobile && isOpen) {
        setIsOpen(false)
      }
    }

    return (
      <Link href={item.href} onClick={handleNavClick}>
        <motion.div
          whileHover={{ x: effectiveIsCollapsed ? 4 : 2, scale: 1.02 }}
          className={`
            relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group
            ${isActive
              ? `${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'} shadow-sm`
              : `${isDark ? 'text-slate-300 hover:bg-slate-800/50 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
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
            <Icon size={20} />
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
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
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

        {/* Toggle button - different behavior for mobile vs desktop */}
        {!isMobile && (
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
            <motion.div
              animate={{ rotate: effectiveIsCollapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.div>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
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
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                EComAI v2.0
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Professional Edition
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )

  // Mobile overlay/backdrop
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={toggleSidebar}
            />

            {/* Mobile Sidebar Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`
                fixed left-0 top-0 bottom-0 z-50 w-80 lg:hidden
                ${isDark ? 'bg-slate-900' : 'bg-white'}
                border-r border-slate-200 dark:border-slate-700
              `}
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    )
  }

  // Desktop Sidebar
  return (
    <motion.aside
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`
        fixed left-0 top-0 bottom-0 z-30 hidden lg:block
        ${isDark ? 'bg-slate-900/95' : 'bg-white/95'}
        backdrop-blur-sm border-r border-slate-200 dark:border-slate-700
      `}
    >
      {sidebarContent}
    </motion.aside>
  )
}
