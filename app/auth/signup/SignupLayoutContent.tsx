'use client'

import { useTheme } from '@/components/ThemeContext'

export default function SignupLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { isDark } = useTheme()

  return (
    <div className={`min-h-screen bg-gradient-to-br ${isDark ? 'from-slate-900 to-slate-800' : 'from-slate-50 to-slate-100'} flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8`}>
      {children}
    </div>
  )
}
