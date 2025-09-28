// app/auth/signup/page.tsx

import { Metadata } from 'next'
import AuthForm from '@/components/AuthForm'

export const metadata: Metadata = {
  title: 'Sign Up - E-Community',
  description: 'Create your E-Community account and join your community platform.',
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <AuthForm type="signup" />
    </div>
  )
}