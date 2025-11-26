'use client'

import dynamic from 'next/dynamic'
import { UserHeader } from '@/components/ui/UserHeader'
import { RoleGuard } from '@/components/mainapp/components'
import { SidebarProvider, useSidebar } from '@/components/ui/SidebarContext'
import { useTheme } from '@/components/ThemeContext'
import { ToastProvider } from '@/components/ToastContext'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

// Lazy load UserSidebar with loading fallback
const UserSidebar = dynamic(() => import('@/components/ui/UserSidebar').then(mod => ({ default: mod.UserSidebar })), {
  loading: () => (
    <div className="fixed left-0 top-0 bottom-0 z-30 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm border-r border-slate-700 w-60">
      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
    </div>
  ),
  ssr: false
})

function UserLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()
  const { isDark } = useTheme()
  const [isSmallScreen, setIsSmallScreen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(max-width: 1279px)') // xl breakpoint -1 for tablet/mobile
    setIsSmallScreen(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setIsSmallScreen(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  const sidebarWidth = isCollapsed ? (isSmallScreen ? 56 : 60) : (isSmallScreen ? 280 : 320)

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <UserSidebar />

      <div className="flex flex-col min-h-screen">
        <UserHeader />

        <main
          className="p-6"
          style={{ marginLeft: isSmallScreen && isCollapsed ? `${sidebarWidth}px` : '0px' }}
        >
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={['Resident', 'Admin']}>
      <ToastProvider>
        <SidebarProvider>
          <UserLayoutContent>{children}</UserLayoutContent>
        </SidebarProvider>
      </ToastProvider>
    </RoleGuard>
  )
}
