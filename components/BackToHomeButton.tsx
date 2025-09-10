'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect } from 'react'

export default function BackToHomeButton() {
  const router = useRouter()

  // Force refresh when navigating back to home
  useEffect(() => {
    const handlePopState = () => {
      // Check if we're navigating to the home page
      if (window.location.pathname === '/') {
        window.location.reload()
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleBackClick = () => {
    // Navigate to home
    router.push('/')
    
    // Force a hard refresh after navigation
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  return (
    <Link 
      href="/" 
      onClick={handleBackClick}
      className="inline-flex items-center gap-2 text-sm font-medium transition-all duration-200 rounded-full px-3 py-1.5 bg-white/70 dark:bg-slate-800/50 text-slate-700 dark:text-white hover:bg-white dark:hover:bg-slate-700/50 backdrop-blur-sm"
    >
      <svg className="w-4 h-4 text-slate-700 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      <span>Back to home</span>
    </Link>
  )
}