//@/components/AuthForm.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, getSession } from 'next-auth/react'
import { getSupabaseClient } from '@/lib/supabase'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Button } from './Button'
import { Input } from './Input'
import { OAuthButton } from './OAuthButton'
import { Toast } from './Toast'
import { 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { useTheme } from './ThemeContext'

// Validation Schemas
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  remember: z.boolean().optional()
})

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[0-9])/, 'Password must contain at least one number')
    .regex(/(?=.*[!@#$%^&*])/, 'Password must contain at least one symbol'),
  communityCode: z.string().optional(),
  role: z.enum(['Resident', 'Admin', 'Guest']),
  terms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions')
}).superRefine((data, ctx) => {
  // Community code is required only for Residents
  if (data.role === 'Resident' && (!data.communityCode || data.communityCode.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Community code is required for residents',
      path: ['communityCode']
    })
  }
})

type LoginFormData = z.infer<typeof loginSchema>
type SignupFormData = z.infer<typeof signupSchema>
type AuthFormData = LoginFormData & Partial<SignupFormData>

interface AuthFormProps {
  type: 'login' | 'signup'
}

export default function AuthForm({ type }: AuthFormProps) {
  // Remove the supabase client creation to avoid multiple instances
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null)
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isDark } = useTheme()

  const isLogin = type === 'login'
  const schema = isLogin ? loginSchema : signupSchema
  
  // Check for success message in URL params
  useEffect(() => {
    const message = searchParams.get('message')
    if (message) {
      setToast({ message, type: 'success' })
      // Clear the message param
      const url = new URL(window.location.href)
      url.searchParams.delete('message')
      window.history.replaceState({}, document.title, url.toString())
    }
  }, [searchParams])

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger
  } = useForm<AuthFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: 'Resident'
    }
  })

  const watchedPassword = watch('password')
  const watchedRole = watch('role')

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: 'Enter password', color: 'gray' }
    
    let score = 0
    if (password.length >= 8) score++
    if (/(?=.*[0-9])/.test(password)) score++
    if (/(?=.*[!@#$%^&*])/.test(password)) score++
    if (/(?=.*[a-z])/.test(password)) score++
    if (/(?=.*[A-Z])/.test(password)) score++

    const levels = [
      { score: 0, label: 'Very Weak', color: 'red' },
      { score: 1, label: 'Weak', color: 'red' },
      { score: 2, label: 'Fair', color: 'yellow' },
      { score: 3, label: 'Good', color: 'blue' },
      { score: 4, label: 'Strong', color: 'green' },
      { score: 5, label: 'Very Strong', color: 'green' }
    ]

    return levels[score] || levels[0]
  }

  const passwordStrength = !isLogin ? getPasswordStrength(watchedPassword || '') : null

  const onSubmit = async (data: any) => {
    setIsLoading(true)
    setError('')

    try {
      if (isLogin) {
        console.log('Attempting login for:', data.email)
        
        const result = await signIn('credentials', {
          email: data.email,
          password: data.password,
          redirect: false,
        })

        if (result?.error) {
          console.log('Login error:', result.error)
          if (result.error.includes('verify')) {
            setError('Please verify your email before signing in')
          } else if (result.error.includes('OAuth')) {
            setError('Please sign in with your OAuth provider')
          } else {
            setError('Invalid email or password')
          }
        } else {
          console.log('Login successful, getting session...')
          setToast({ message: 'Successfully signed in! Redirecting...', type: 'success' })
          
          // Wait for session to be established, then redirect based on role
          setTimeout(async () => {
            try {
              // Fetch user role from API instead of session
              const response = await fetch('/api/me/summary')
              const data = await response.json()
              const role = data.user?.role?.toLowerCase() || ''
              
              let redirectPath = ''
              switch (role) {
                case 'admin':
                  redirectPath = '/main/admin'
                  break
                case 'resident':
                  redirectPath = '/main/user'
                  break
                case 'guest':
                  redirectPath = '/main/guest'
                  break
                default:
                  redirectPath = '/main/guest'
              }
              
              console.log('Redirecting to:', redirectPath, 'for role:', role)
              window.location.href = redirectPath
            } catch (error) {
              console.error('Role fetch failed, using fallback redirect:', error)
              window.location.href = '/main'
            }
          }, 1500)
        }
      } else {
        // Signup flow
        console.log('Attempting signup for:', data.email)
        
        // Check for duplicate email before signup
        const emailCheckResponse = await fetch(`/api/auth/check-email?email=${encodeURIComponent(data.email)}`)
        const { exists } = await emailCheckResponse.json()
        
        if (exists) {
          setError('An account with this email already exists')
          setIsLoading(false)
          return
        }

        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        const result = await response.json()
        console.log('Signup response:', result)

        if (response.ok && result.success) {
          setToast({ message: result.message, type: 'success' })
          
          setTimeout(() => {
            router.push(`/verification?email=${encodeURIComponent(result.email)}`)
          }, 1500)
        } else {
          setError(result.message || 'Something went wrong')
        }
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(true)
    try {
      const result = await signIn(provider, { 
        redirect: false,
        callbackUrl: '/main'
      })
      
      if (result?.error) {
        setError('OAuth sign-in failed')
      }
    } catch (err) {
      setError('OAuth sign-in failed')
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = async () => {
    const fieldsToValidate = step === 1 ? ['email', 'password'] : ['fullName', 'communityCode', 'role', 'terms']
    const isValid = await trigger(fieldsToValidate as any)
    if (isValid) setStep(2)
  }

  const closeToast = () => {
    setToast(null)
  }

  return (
    <div className="w-full max-w-6xl mx-auto relative">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}

      <div className="grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Form Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className={`bg-white ${isDark ? 'dark:bg-slate-800' : ''} rounded-3xl shadow-2xl p-8 border ${isDark ? 'border-slate-700' : 'border-slate-200'} relative`}
        >
          {/* Back to home button */}
          <div className="absolute top-6 left-6 z-10">
            <Link 
              href="/" 
              className={`inline-flex items-center gap-2 text-sm font-medium transition-all duration-200 rounded-full px-3 py-1.5 ${isDark ? 'bg-slate-800/50 text-white hover:bg-slate-700/50' : 'bg-white/70 text-slate-700 hover:bg-white'} backdrop-blur-sm`}
            >
              <svg className={`w-4 h-4 ${isDark ? 'text-white' : 'text-slate-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to home</span>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8 pt-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className={`w-16 h-16 ${isDark ? 'bg-gradient-to-r from-slate-700 to-slate-900' : 'bg-gradient-primary'} rounded-2xl flex items-center justify-center mx-auto mb-4`}
            >
              <span className="text-white font-bold text-2xl">E</span>
            </motion.div>
            
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'} mb-2`}>
              {isLogin ? 'Welcome back' : 'Join E-Community'}
            </h1>
            <p className={isDark ? 'text-white/60' : 'text-black/60'}>
              {isLogin 
                ? 'Sign in to access your community platform' 
                : 'Create your account and start building connections'
              }
            </p>

            {!isLogin && (
              <div className="flex items-center justify-center mt-4 space-x-4">
                <div className={`flex items-center space-x-2 ${step >= 1 ? (isDark ? 'text-white' : 'text-black') : (isDark ? 'text-white/40' : 'text-black/40')}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? (isDark ? 'bg-slate-600 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-600 text-white') : (isDark ? 'bg-slate-700 text-white/60 dark:bg-slate-700 dark:text-slate-400' : 'bg-slate-300 text-slate-600')}`}>
                    {step > 1 ? <CheckCircleIcon className="w-4 h-4" /> : '1'}
                  </div>
                  <span className="text-sm">Account</span>
                </div>
                <div className={`w-8 h-0.5 ${step > 1 ? (isDark ? 'bg-white' : 'bg-black') : (isDark ? 'bg-white/20' : 'bg-black/20')}`}></div>
                <div className={`flex items-center space-x-2 ${step >= 2 ? (isDark ? 'text-white' : 'text-black') : (isDark ? 'text-white/40' : 'text-black/40')}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? (isDark ? 'bg-slate-600 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-600 text-white') : (isDark ? 'bg-slate-700 text-white/60 dark:bg-slate-700 dark:text-slate-400' : 'bg-slate-300 text-slate-600')}`}>
                    2
                  </div>
                  <span className="text-sm">Profile</span>
                </div>
              </div>
            )}
          </div>

          {/* OAuth Buttons - Only Google */}
          <div className="space-y-3 mb-6">
            <OAuthButton
              provider="google"
              onClick={() => handleOAuthSignIn('google')}
              isLoading={isLoading}
            />
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${isDark ? 'border-slate-700' : 'border-slate-300'}`}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-2 bg-white ${isDark ? 'dark:bg-slate-800' : ''} ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                Or continue with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <AnimatePresence mode="wait">
              {isLogin || step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <Input
                    label="Email Address"
                    type="email"
                    {...register('email')}
                    error={errors.email?.message?.toString()}
                    placeholder="you@example.com"
                  />

                  <div className="relative">
                    <Input
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      error={errors.password?.message?.toString()}
                      placeholder="••••••••"
                    />
                    
                    {!isLogin && passwordStrength && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-2"
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className={isDark ? 'text-white/60' : 'text-black/60'}>Password strength</span>
                          <span className={`font-medium ${passwordStrength.color === 'red' ? (isDark ? 'text-red-400' : 'text-red-600') : passwordStrength.color === 'yellow' ? (isDark ? 'text-yellow-400' : 'text-yellow-600') : passwordStrength.color === 'blue' ? (isDark ? 'text-blue-400' : 'text-blue-600') : (isDark ? 'text-green-400' : 'text-green-600')}`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className={`w-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'} rounded-full h-1`}>
                          <div
                            className={`h-1 rounded-full ${passwordStrength.color === 'red' ? 'bg-red-500' : passwordStrength.color === 'yellow' ? 'bg-yellow-500' : passwordStrength.color === 'blue' ? 'bg-blue-500' : 'bg-green-500'} transition-all duration-300`}
                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                          ></div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {isLogin && (
                    <div className="flex items-center justify-between">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          {...register('remember')}
                          className={`w-4 h-4 ${isDark ? 'text-slate-600 bg-slate-800 border-slate-700' : 'text-slate-600 bg-white border-slate-300'} rounded focus:ring-slate-500 focus:ring-2 dark:bg-slate-800 dark:border-slate-700`}
                        />
                        <span className={`ml-2 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>Remember me</span>
                      </label>
                      <Link
                        href="/forgot-password"
                        className={`text-sm ${isDark ? 'text-white hover:text-white/80' : 'text-black hover:text-black/80'}`}
                      >
                        Forgot password?
                      </Link>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <Input
                    label="Full Name"
                    {...register('fullName')}
                    error={errors.fullName?.message?.toString()}
                    placeholder="John Doe"
                  />

                  <div>
                    <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-black'} mb-2`}>
                      Role
                    </label>
                    <select
                      {...register('role')}
                      className={`w-full px-4 py-3 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-black'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200`}
                    >
                      <option value="Resident">Resident</option>
                      <option value="Admin">Admin</option>
                      <option value="Guest">Guest</option>
                    </select>
                    {errors.role && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.role.message?.toString()}
                      </p>
                    )}
                  </div>

                  {watchedRole === 'Resident' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Input
                        label="Community Code"
                        {...register('communityCode')}
                        error={errors.communityCode?.message}
                        placeholder="PALATIW-001"
                        helperText="Required for residents - ask your community admin for this code"
                      />
                    </motion.div>
                  )}

                  {watchedRole !== 'Resident' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Input
                        label="Community Code (Optional)"
                        {...register('communityCode')}
                        error={errors.communityCode?.message}
                        placeholder="PALATIW-001"
                        helperText="Optional for admins and guests"
                      />
                    </motion.div>
                  )}

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      {...register('terms')}
                      className={`w-4 h-4 mt-1 ${isDark ? 'text-slate-600 bg-slate-800 border-slate-700' : 'text-slate-600 bg-white border-slate-300'} rounded focus:ring-slate-500 focus:ring-2 dark:bg-slate-800 dark:border-slate-700`}
                    />
                    <div className="ml-3">
                      <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                        I agree to the{' '}
                        <Link href="/terms" className={isDark ? 'text-white hover:text-white/80' : 'text-black hover:text-black/80'}>
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className={isDark ? 'text-white hover:text-white/80' : 'text-black hover:text-black/80'}>
                          Privacy Policy
                        </Link>
                      </p>
                      {errors.terms && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.terms.message?.toString()}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`bg-red-50 ${isDark ? 'dark:bg-red-900/20' : ''} border ${isDark ? 'border-red-700' : 'border-red-200'} rounded-xl p-4 flex items-center gap-3`}
              >
                <XCircleIcon className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
              </motion.div>
            )}

            <div className="space-y-4">
              {isLogin || step === 2 ? (
                <>
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    isLoading={isLoading}
                  >
                    {isLoading 
                      ? (isLogin ? 'Signing in...' : 'Creating account...') 
                      : (isLogin ? 'Sign In' : 'Create Account')
                    }
                  </Button>
                  
                  {!isLogin && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => setStep(1)}
                    >
                      Back to previous step
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  className="w-full"
                  onClick={nextStep}
                >
                  Continue
                </Button>
              )}
            </div>

            <div className="text-center">
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <Link
                  href={isLogin ? '/auth/signup' : '/auth/login'}
                  className={isDark ? 'font-medium text-white hover:text-white/80' : 'font-medium text-black hover:text-black/80'}
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </Link>
              </p>
            </div>
          </form>
        </motion.div>

        {/* Illustration Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden lg:block"
        >
          <div className="relative">
            <div className={`bg-gradient-to-br ${isDark ? 'from-slate-800/30 to-slate-900/30' : 'from-slate-200/20 to-slate-300/20'} rounded-3xl p-12 text-center`}>
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, 0]
                }}
                transition={{ 
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="mb-8"
              >
                <div className={`w-32 h-32 ${isDark ? 'bg-gradient-to-r from-slate-700 to-slate-900' : 'bg-gradient-primary'} rounded-3xl flex items-center justify-center mx-auto mb-6`}>
                  <UserIcon className="w-16 h-16 text-white" />
                </div>
              </motion.div>
              
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'} mb-4`}>
                {isLogin ? 'Welcome back!' : 'Join the community'}
              </h2>
              <p className={`text-lg leading-relaxed ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                {isLogin 
                  ? 'Access your community dashboard, participate in polls, and stay connected with your neighbors.'
                  : 'Be part of a transparent, secure platform that empowers communities to make better decisions together.'
                }
              </p>

              {/* Feature highlights */}
              <div className="mt-8 space-y-4">
                {[
                  { icon: CheckCircleIcon, text: 'Secure & Private' },
                  { icon: UserIcon, text: 'Easy to Use' },
                  { icon: EnvelopeIcon, text: '24/7 Support' }
                ].map((feature, index) => (
                  <motion.div
                    key={feature.text}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    className="flex items-center justify-center gap-3"
                  >
                    <feature.icon className={`w-5 h-5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                    <span className={isDark ? 'text-white/80' : 'text-black/80'}>{feature.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Background decorations */}
            <div className={`absolute -top-12 -right-12 w-24 h-24 ${isDark ? 'bg-gradient-to-br from-slate-700/20 to-slate-800/20' : 'bg-gradient-to-br from-slate-400/20 to-slate-500/20'} rounded-full blur-xl`}></div>
            <div className={`absolute -bottom-12 -left-12 w-32 h-32 ${isDark ? 'bg-gradient-to-tr from-slate-800/20 to-slate-700/20' : 'bg-gradient-to-tr from-slate-500/20 to-slate-400/20'} rounded-full blur-xl`}></div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}