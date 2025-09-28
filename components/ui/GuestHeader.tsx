// @/components/ui/GuestHeader.tsx
'use client'

import { useState } from 'react'
import { useTheme } from '@/components/ThemeContext'
import { motion } from 'framer-motion'
import { Search, Moon, Sun, LogIn } from 'lucide-react'
import Link from 'next/link'

export function GuestHeader() {
  const { isDark, toggleTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Implement search functionality for guests (e.g., search public polls/complaints)
      console.log('Searching for:', searchQuery)
    }
  }

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
        {/* Left: Search */}
        <div className="flex items-center space-x-4">
          <form onSubmit={handleSearch} className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search community content..."
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

          {/* Welcome Message */}
          <div className="hidden md:block">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Welcome, Guest
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-4">
          {/* Join Community Button */}
          <Link
            href="/main/guest/access"
            className="hidden md:inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span className="text-sm font-medium">Join Community</span>
          </Link>

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
        </div>
      </div>
    </motion.header>
  )
}
