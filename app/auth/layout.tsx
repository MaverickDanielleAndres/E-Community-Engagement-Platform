// @/app/auth/layout.tsx
'use client'

import { AuthGuard } from '@/components/AuthGuard'
import { CustomThemeProvider, useTheme } from '@/components/ThemeContext'

function AuthLayoutContent({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme()

  return (
    <AuthGuard redirectTo="" redirectIfAuthenticated={false}>
      <div className={`min-h-screen bg-gradient-to-br ${isDark ? 'from-slate-900 via-slate-900 to-slate-800' : 'from-emerald-50 via-white to-sky-50'} flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8`}>
        {children}
      </div>
    </AuthGuard>
  )
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CustomThemeProvider>
      <AuthLayoutContent>{children}</AuthLayoutContent>
    </CustomThemeProvider>
  )
}
