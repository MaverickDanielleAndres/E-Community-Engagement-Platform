import { Metadata } from 'next'
import AuthForm from '@/components/AuthForm'

export const metadata: Metadata = {
  title: 'Log In - E-Community',
  description: 'Sign in to your E-Community account',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <AuthForm type="login" />
    </div>
  )
}