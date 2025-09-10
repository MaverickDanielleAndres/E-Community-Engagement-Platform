// @/components/LayoutWrapper.tsx
'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

interface LayoutWrapperProps {
  children: ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  
  // You can add global layout logic here
  // For example, different layouts for different route patterns
  
  const isAuthPage = pathname?.startsWith('/auth') || pathname?.startsWith('/login') || pathname?.startsWith('/signup')
  const isDashboardPage = pathname?.startsWith('/main/dashboard') || pathname?.startsWith('/main')
  const isHomePage = pathname === '/'
  
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}