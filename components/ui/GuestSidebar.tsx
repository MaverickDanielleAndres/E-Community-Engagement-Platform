// @/components/ui/GuestSidebar.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/components/ThemeContext'
import { useSidebar } from '@/components/ui/SidebarContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Bot, Users, MessageSquareWarning,
  Settings, ChevronLeft, ChevronRight, Target, Eye
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

interface NavSection {
  title: string
  items: NavItem[]
}

export function GuestSidebar() {
  const { isCollapsed, setIsCollapsed } = useSidebar()
  const { isDark } = useTheme()
  const pathname = usePathname()

  // Check if mobile/tablet screens using matchMedia for better reliability (default collapsed below xl)
  const [isSmallScreen, setIsSmallScreen] = useState(false)

  // Use isCollapsed directly, no forcing
  const effectiveIsCollapsed = isCollapsed

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

  const navigationSections: NavSection[] = [
    {
      title: "Overview",
      items: [
        { label: "Dashboard", href: "/main/guest", icon: LayoutDashboard },
        { label: "Explore Polls", href: "/main/guest/explore/polls", icon: Target },
        { label: "Explore Complaints", href: "/main/guest/explore/complaints", icon: MessageSquareWarning }
      ]
    },
    {
      title: "Community",
      items: [
        { label: "Ask EComAI", href: "/main/guest/ask-ecomai", icon: Bot },
        { label: "Join Community", href: "/main/guest/access", icon: Users }
      ]
    },
    {
      title: "Account",
      items: [
        { label: "Settings", href: "/main/guest/settings", icon: Settings }
      ]
    }
  ]

  const NavItemComponent = ({ item, isCollapsed }: { item: NavItem; isCollapsed: boolean }) => {
    const isActive = pathname === item.href
    const Icon = item.icon

    const handleNavClick = () => {
      // Collapse sidebar on small screens when navigation link is clicked
      if (isSmallScreen && !isCollapsed) {
        setIsCollapsed(true)
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
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Guest Portal</p>
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
      <nav className="flex-1 p-4 space-y-6">
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
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Explore our community
              </p>
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
      animate={{ width: isCollapsed ? 80 : 320 }}
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
