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

  // Hide header/footer on auth pages and main pages (admin, user, guest)
  const showHeaderFooter = !(isAuthPage || isMainPage)

  return (
    <>
      {showHeaderFooter && <Header />}
      {children}
      {showHeaderFooter && <Footer />}
    </>
  )
}
