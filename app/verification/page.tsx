// @/app/verification/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Toast } from '@/components/Toast'
import { Button } from '@/components/Button'
import { 
  EnvelopeIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

export default function VerificationPage() {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null)
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutes in seconds
  const [canResend, setCanResend] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const email = searchParams.get('email')

  useEffect(() => {
    if (!email) {
      router.push('/auth/signup')
      return
    }

    // Get user data from sessionStorage (stored during signup)
    const storedUserData = sessionStorage.getItem('pendingUserData')
    if (storedUserData) {
      try {
        const parsedData = JSON.parse(storedUserData)
        
        // Check if data has expired (30 minutes)
        const expiresAt = new Date(parsedData.expiresAt)
        const now = new Date()
        
        if (expiresAt < now) {
          sessionStorage.removeItem('pendingUserData')
          setToast({ message: 'Session expired. Please sign up again.', type: 'error' })
          setTimeout(() => router.push('/auth/signup'), 3000)
          return
        }
        
        setUserData(parsedData)
      } catch (error) {
        console.error('Failed to parse user data:', error)
        setToast({ message: 'Invalid session. Please sign up again.', type: 'error' })
        setTimeout(() => router.push('/auth/signup'), 3000)
        return
      }
    } else {
      setToast({ message: 'No signup session found. Please sign up first.', type: 'error' })
      setTimeout(() => router.push('/auth/signup'), 3000)
      return
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Enable resend after 1 minute initially
    const resendTimer = setTimeout(() => {
      setCanResend(true)
    }, 60000)

    return () => {
      clearInterval(timer)
      clearTimeout(resendTimer)
    }
  }, [email, router])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return // Only allow single character
    
    const newCode = [...code]
    newCode[index] = value.toUpperCase()
    setCode(newCode)
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
    
    // Auto-submit if all fields are filled
    if (newCode.every(digit => digit !== '') && value) {
      handleSubmit(newCode)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').toUpperCase().slice(0, 6)
    const newCode = pastedData.split('').concat(Array(6 - pastedData.length).fill(''))
    setCode(newCode)
    
    // Focus the next empty input or last input
    const nextEmptyIndex = newCode.findIndex(digit => digit === '')
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex
    inputRefs.current[focusIndex]?.focus()
    
    // Auto-submit if complete
    if (pastedData.length === 6) {
      handleSubmit(newCode)
    }
  }

  const handleSubmit = async (codeArray = code) => {
    if (codeArray.some(digit => digit === '')) {
      setToast({ message: 'Please enter all 6 digits', type: 'error' })
      return
    }

    if (!userData || !email) {
      setToast({ message: 'Session expired. Please sign up again.', type: 'error' })
      router.push('/auth/signup')
      return
    }

    setIsVerifying(true)

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: codeArray.join(''),
          userData
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setToast({ message: result.message, type: 'success' })
        
        // Clear stored user data
        sessionStorage.removeItem('pendingUserData')
        
        // Redirect to login after success
        setTimeout(() => {
          router.push('/auth/login?message=' + encodeURIComponent('Account created successfully! Please sign in.'))
        }, 2000)
      } else {
        setToast({ message: result.message || 'Verification failed', type: 'error' })
        setCode(['', '', '', '', '', '']) // Clear code on error
        inputRefs.current[0]?.focus()
      }
    } catch (error) {
      console.error('Verification error:', error)
      setToast({ message: 'An unexpected error occurred', type: 'error' })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendCode = async () => {
    if (!canResend || !email || isResending) return

    setIsResending(true)

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (result.success) {
        setToast({ message: result.message, type: 'success' })
        setTimeLeft(15 * 60) // Reset timer
        setCanResend(false)
        setCode(['', '', '', '', '', '']) // Clear current code
        inputRefs.current[0]?.focus()
        
        // Enable resend again after 1 minute
        setTimeout(() => {
          setCanResend(true)
        }, 60000)
      } else {
        setToast({ message: result.message, type: 'error' })
      }
    } catch (error) {
      console.error('Resend error:', error)
      setToast({ message: 'Failed to resend code', type: 'error' })
    } finally {
      setIsResending(false)
    }
  }

  if (!email) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4 py-12">
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
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700">
          
          {/* Back to signup button */}
          <div className="mb-6">
            <Link 
              href="/auth/signup" 
              className="inline-flex items-center gap-2 text-sm font-medium transition-all duration-200 rounded-full px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to sign up</span>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-16 h-16 bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4"
            >
              <EnvelopeIcon className="w-8 h-8 text-white" />
            </motion.div>
            
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Check your email
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              We've sent a 6-digit verification code to:
            </p>
            <p className="text-slate-900 dark:text-slate-100 font-semibold">
              {email}
            </p>
          </div>

          {/* Code Input */}
          <div className="mb-6">
            <div className="flex gap-3 justify-center mb-4">
              {code.map((digit, index) => (
                <motion.input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className={`
                    w-12 h-12 text-center text-xl font-bold bg-slate-50 dark:bg-slate-900 
                    border-2 rounded-xl transition-all duration-200 focus:outline-none
                    ${digit 
                      ? 'border-slate-900 dark:border-slate-100 bg-white dark:bg-slate-800' 
                      : 'border-slate-300 dark:border-slate-600 focus:border-slate-500'
                    }
                    text-slate-900 dark:text-slate-100
                  `}
                  whileFocus={{ scale: 1.05 }}
                />
              ))}
            </div>

            <div className="text-center text-sm text-slate-500 dark:text-slate-400">
              Enter the 6-digit code sent to your email
            </div>
          </div>

          {/* Timer and Resend */}
          <div className="text-center mb-6">
            {timeLeft > 0 ? (
              <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400">
                <ClockIcon className="w-4 h-4" />
                <span>Code expires in {formatTime(timeLeft)}</span>
              </div>
            ) : (
              <div className="text-red-600 dark:text-red-400">
                Code has expired
              </div>
            )}
            
            <div className="mt-3">
              <button
                onClick={handleResendCode}
                disabled={!canResend || isResending}
                className={`
                  text-sm font-medium transition-all duration-200
                  ${canResend && !isResending
                    ? 'text-slate-600 hover:text-slate-500 dark:text-slate-400 dark:hover:text-slate-300 cursor-pointer'
                    : 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  }
                `}
              >
                {isResending ? (
                  <span className="flex items-center gap-2">
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    Sending...
                  </span>
                ) : (
                  'Resend verification code'
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={() => handleSubmit()}
            variant="primary"
            className="w-full"
            isLoading={isVerifying}
            disabled={code.some(digit => digit === '')}
          >
            {isVerifying ? 'Verifying...' : 'Verify Email'}
          </Button>

          {/* Help Text */}
          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            <p>Didn't receive the email? Check your spam folder.</p>
            <p className="mt-1">
              Wrong email?{' '}
              <Link
                href="/auth/signup"
                className="text-slate-600 hover:text-slate-500 dark:text-slate-400 dark:hover:text-slate-300 font-medium"
              >
                Try again
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}