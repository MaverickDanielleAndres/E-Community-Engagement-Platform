// @/components/MainAppSidebar.tsx
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  HomeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  SpeakerWaveIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  XMarkIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/mainapp/dashboard', icon: HomeIcon },
  { name: 'Polls & Voting', href: '/mainapp/polls', icon: ChartBarIcon },
  { name: 'Complaints', href: '/mainapp/complaints', icon: ExclamationTriangleIcon },
  { name: 'Feedback', href: '/mainapp/feedback', icon: ChatBubbleLeftRightIcon },
  { name: 'Events', href: '/mainapp/events', icon: CalendarIcon },
  { name: 'Announcements', href: '/mainapp/announcements', icon: SpeakerWaveIcon },
  { name: 'Community', href: '/mainapp/community', icon: UserGroupIcon },
  { name: 'Settings', href: '/mainapp/settings', icon: Cog6ToothIcon },
]

export default function MainAppSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700"
        >
          <Bars3Icon className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        </button>
      </div>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 
          transform transition-transform duration-300 ease-in-out lg:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-700">
          <Link href="/mainapp/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">E-Community</span>
          </Link>
          
          {/* Close button for mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <XMarkIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-800 dark:from-slate-500 dark:to-slate-700 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {session?.user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                  ${isActive
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <Link
            href="/mainapp/help"
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Help & Support</span>
          </Link>
        </div>
      </motion.div>
    </>
  )
}