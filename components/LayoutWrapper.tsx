'use client'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface LayoutWrapperProps {
  children: ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()

  const isAuthPage = pathname.startsWith('/auth/')
  const isMainPage = pathname.startsWith('/main/admin') || pathname.startsWith('/main/user') || pathname.startsWith('/main/guest')
  const isLanding = pathname === '/'
  const isIdVerification = pathname === '/id-verification'

  // Show header only on landing page
  const showHeader = isLanding

  // Show footer only on landing page
  const showFooter = isLanding

  return (
    <>
      {showHeader && <Header />}
      {children}
      {showFooter && <Footer />}
    </>
  )
}
