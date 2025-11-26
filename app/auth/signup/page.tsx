// app/auth/signup/page.tsx

'use client'

import AuthForm from '@/components/AuthForm'
import { useTheme } from '@/components/ThemeContext'



export default function SignupPage() {
  const { isDark } = useTheme()

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8`}>
      <AuthForm type="signup" />
    </div>
  )
}
