// @/components/AuthGuard.tsx
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Toast } from './Toast'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
  redirectIfAuthenticated?: boolean
}

export function AuthGuard({ 
  children, 
  redirectTo = '/', 
  redirectIfAuthenticated = true 
}: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && session && redirectIfAuthenticated) {
      setShowToast(true)
      setTimeout(() => {
        // Only redirect if redirectTo is not empty string
        if (redirectTo) {
          router.push(redirectTo)
        }
      }, 2000)
    }
  }, [session, status, router, redirectTo, redirectIfAuthenticated])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-slate-100"></div>
      </div>
    )
  }

  if (status === 'authenticated' && session && redirectIfAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        {showToast && (
          <Toast
            message="Welcome back! Redirecting to dashboard..."
            type="success"
            onClose={() => setShowToast(false)}
          />
        )}
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-slate-100 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Redirecting...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}