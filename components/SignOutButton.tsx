'use client'
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { Button } from './Button'
import { Toast } from './Toast'
import { ArrowRightOnRectangleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'

export default function SignOutButton() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const handleSignOutClick = () => {
    setShowConfirm(true)
  }

  const handleConfirmSignOut = async () => {
    setIsLoading(true)
    setShowConfirm(false)

    try {
      // Show signing out toast
      setToast({ message: 'Signing out...', type: 'success' })

      // Clear all client-side storage
      if (typeof window !== 'undefined') {
        // Clear localStorage
        localStorage.clear()
        
        // Clear sessionStorage
        sessionStorage.clear()
        
        // Clear any other browser storage
        try {
          // Clear IndexedDB if used
          if (window.indexedDB) {
            const databases = await indexedDB.databases?.()
            databases?.forEach(db => {
              if (db.name) indexedDB.deleteDatabase(db.name)
            })
          }
        } catch (error) {
          console.log('Could not clear IndexedDB:', error)
        }

        // Clear any cookies we can access from client side
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=")
          const name = eqPos > -1 ? c.substr(0, eqPos) : c
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
        })
      }

      // Sign out with NextAuth - this will clear NextAuth cookies and JWT
      const result = await signOut({ 
        redirect: false,
        callbackUrl: '/'
      })

      // Additional cleanup: make a request to clear server-side session
      try {
        await fetch('/api/auth/signout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      } catch (error) {
        console.log('Additional cleanup request failed:', error)
      }

      // Show success message
      setToast({ message: 'Successfully signed out! Redirecting...', type: 'success' })

      // Force redirect with a slight delay
      setTimeout(() => {
        // Force a complete page reload to clear any remaining cached data
        window.location.replace('/')
      }, 1500)

    } catch (error) {
      console.error('Sign out error:', error)
      setToast({ message: 'Sign out failed. Forcing logout...', type: 'error' })
      
      // Fallback: force redirect even if signOut fails
      setTimeout(() => {
        window.location.replace('/')
      }, 2000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelSignOut = () => {
    setShowConfirm(false)
  }

  return (
    <>
      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Sign out button */}
      <Button
        variant="ghost"
        onClick={handleSignOutClick}
        className="flex items-center gap-2"
        disabled={isLoading}
      >
        <ArrowRightOnRectangleIcon className="w-4 h-4" />
        {isLoading ? 'Signing out...' : 'Sign Out'}
      </Button>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={handleCancelSignOut}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-6">
                {/* Icon */}
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 text-center mb-2">
                  Sign out of your account?
                </h3>

                {/* Description */}
                <p className="text-slate-600 dark:text-slate-400 text-center mb-6">
                  You will be signed out of your account and redirected to the homepage. 
                  Any unsaved changes will be lost.
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={handleCancelSignOut}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleConfirmSignOut}
                    className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                    isLoading={isLoading}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing out...' : 'Sign out'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}