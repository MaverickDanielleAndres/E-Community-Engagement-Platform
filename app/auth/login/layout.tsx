
// app/login/layout.tsx
'use client'

import { useTheme } from '@/components/ThemeContext'

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isDark } = useTheme()

  return (
    <div className='flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8'>
      {children}
    </div>
  )
}
