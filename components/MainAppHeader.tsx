// @/components/MainAppHeader.tsx
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { ThemeToggle } from '@/components/ThemeToggle'
import SignOutButton from '@/components/SignOutButton'
import { 
  BellIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'

export default function MainAppHeader() {
  const { data: session } = useSession()
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 flex items-center justify-between">
      {/* Left side - Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent sm:text-sm"
            placeholder="Search..."
          />
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <button className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors duration-200">
          <BellIcon className="w-6 h-6" />
          {/* Notification badge */}
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2 p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors duration-200"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-800 dark:from-slate-500 dark:to-slate-700 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {session?.user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {session?.user?.name || 'User'}
              </p>
            </div>
            <ChevronDownIcon className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {isProfileMenuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsProfileMenuOpen(false)}
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-20"
              >
                <div className="py-2">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {session?.user?.name || 'User'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {session?.user?.email}
                    </p>
                  </div>
                  
                  <div className="py-2">
                    <a
                      href="/mainapp/profile"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <UserCircleIcon className="w-5 h-5" />
                      Profile Settings
                    </a>
                    
                    <a
                      href="/mainapp/preferences"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Preferences
                    </a>
                  </div>
                  
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
                    <div className="px-4 py-2">
                      <SignOutButton />
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}