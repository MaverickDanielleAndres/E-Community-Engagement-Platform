'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Toast } from '@/components/Toast'
import { Button } from '@/components/Button'
import { ConfirmDialog } from '@/components/mainapp/components'
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  BellIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

export default function WaitingPage() {
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isReminding, setIsReminding] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null)
  const router = useRouter()
  const { data: session } = useSession()

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/user/status')
      const result = await response.json()

      if (response.ok && result.success) {
        setStatus(result.status)

        if (result.status === 'rejected') {
          setToast({ message: 'Your verification was rejected. Please sign up again.', type: 'error' })
          setTimeout(() => {
            router.push('/auth/signup')
          }, 3000)
        }
      } else if (response.status === 401) {
        // User not authenticated, redirect to login
        setToast({ message: 'Please log in to check your verification status.', type: 'error' })
        setTimeout(() => {
          router.push('/auth/login?from=' + encodeURIComponent('/main/guest/waiting'))
        }, 3000)
      } else {
        console.error('Status check failed:', result.message)
        setToast({ message: result.message || 'Failed to check status. Please try again.', type: 'error' })
      }
    } catch (error) {
      console.error('Status check error:', error)
      setToast({ message: 'Network error. Please check your connection.', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemindAdmin = async () => {
    setIsReminding(true)
    try {
      const response = await fetch('/api/guest/remind-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setToast({ message: result.message, type: 'success' })
      } else if (response.status === 401) {
        // User not authenticated, redirect to login
        setToast({ message: 'Please log in to send a reminder.', type: 'error' })
        setTimeout(() => {
          router.push('/auth/login?from=' + encodeURIComponent('/main/guest/waiting'))
        }, 3000)
      } else {
        setToast({ message: result.message || 'Failed to send reminder', type: 'error' })
      }
    } catch (error) {
      console.error('Remind admin error:', error)
      setToast({ message: 'Network error. Please check your connection.', type: 'error' })
    } finally {
      setIsReminding(false)
    }
  }

  const handleCancelVerification = async () => {
    setIsDeleting(true)
    setShowConfirm(false)
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setToast({ message: result.message, type: 'success' })
        // Sign out and redirect
        await signOut({ callbackUrl: '/auth/signup?message=' + encodeURIComponent('Account deleted. Please sign up again.') })
      } else {
        setToast({ message: result.message || 'Failed to cancel verification', type: 'error' })
      }
    } catch (error) {
      console.error('Cancel verification error:', error)
      setToast({ message: 'Network error. Please check your connection.', type: 'error' })
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    // Initial check
    checkStatus()

    // Poll every 30 seconds
    const interval = setInterval(checkStatus, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleManualCheck = () => {
    setIsLoading(true)
    checkStatus()
  }

  if (isLoading && !status) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-600 dark:text-slate-400" />
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">Checking your verification status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4 py-8 sm:py-12">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto"
      >
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 border border-slate-200 dark:border-slate-700 text-center">

          {/* Status Icon */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full flex items-center justify-center"
          >
            {status === 'pending' && (
              <div className="w-full h-full bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                <ClockIcon className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-600 dark:text-yellow-400" />
              </div>
            )}
            {status === 'approved' && (
              <div className="w-full h-full bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 dark:text-green-400" />
              </div>
            )}
            {status === 'rejected' && (
              <div className="w-full h-full bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <XCircleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-red-600 dark:text-red-400" />
              </div>
            )}
          </motion.div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3 sm:mb-4">
            {status === 'pending' && 'Verification Pending'}
            {status === 'approved' && 'Account Approved!'}
            {status === 'rejected' && 'Verification Rejected'}
          </h1>

          {/* Message */}
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-6">
            {status === 'pending' && 'Your ID verification has been submitted and is being reviewed by our administrators. This usually takes 1-2 business days.'}
            {status === 'approved' && 'Congratulations! Your account has been approved. Click the button below to access your dashboard.'}
            {status === 'rejected' && 'Unfortunately, your verification was not approved. You will be redirected to sign up again.'}
          </p>

          {/* Action Buttons */}
          {status === 'pending' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleManualCheck}
                  variant="outline"
                  className="flex-1"
                  isLoading={isLoading}
                >
                  {isLoading ? 'Checking...' : 'Check Status'}
                </Button>

                <Button
                  onClick={handleRemindAdmin}
                  variant="primary"
                  className="flex-1"
                  isLoading={isReminding}
                >
                  <BellIcon className="w-4 h-4 mr-2" />
                  {isReminding ? 'Sending...' : 'Remind Admin'}
                </Button>
              </div>

              {session && (
                <Button
                  onClick={() => setShowConfirm(true)}
                  variant="outline"
                  className="w-full bg-red-500 hover:bg-red-600 text-white border-red-500"
                  isLoading={isDeleting}
                  disabled={!session}
                >
                  <XMarkIcon className="w-4 h-4 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Cancel Verification'}
                </Button>
              )}

              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Status automatically updates every 30 seconds • Reminder has 2-hour cooldown
              </p>
            </div>
          )}

          {status === 'approved' && (
            <div className="space-y-4">
            <Button
                onClick={() => signOut({ redirect: true, callbackUrl: '/' })}
                variant="primary"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Go to Dashboard
              </Button>
            </div>
          )}

          {/* Contact Info */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Need help? Contact our support team.
            </p>
          </div>
        </div>
      </motion.div>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleCancelVerification}
        title="Cancel Verification"
        description="This action will permanently delete your account, verification request, and any uploaded documents. This cannot be undone. You will need to create a new account."
        confirmLabel="Delete Account"
        cancelLabel="Keep Waiting"
        loading={isDeleting}
      />
    </div>
  )
}
