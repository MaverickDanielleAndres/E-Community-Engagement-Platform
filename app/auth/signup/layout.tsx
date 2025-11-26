// @/app/auth/signup/layout.tsx
'use client'
import { AuthGuard } from '@/components/AuthGuard'
import { CustomThemeProvider } from '@/components/ThemeContext'
import { useTheme } from '@/components/ThemeContext'

function SignupLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { isDark } = useTheme()
  return (
    <AuthGuard redirectTo="/main/admin" redirectIfAuthenticated={true}>
      <div className={`min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8`}>
        {children}
      </div>
    </AuthGuard>
  )
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CustomThemeProvider>
      <SignupLayoutContent>{children}</SignupLayoutContent>
    </CustomThemeProvider>
  )
}