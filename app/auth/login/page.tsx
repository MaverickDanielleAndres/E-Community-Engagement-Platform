'use client'

import AuthForm from '@/components/AuthForm'
import { useTheme } from '@/components/ThemeContext'

export default function LoginPage() {
  const { isDark } = useTheme()

  return (
    <div>
      <AuthForm type="login" />
    </div>
  )
}
