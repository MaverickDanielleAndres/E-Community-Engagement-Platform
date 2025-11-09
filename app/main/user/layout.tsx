'use client'

import { UserSidebar } from '@/components/ui/UserSidebar'
import { UserHeader } from '@/components/ui/UserHeader'
import { RoleGuard } from '@/components/mainapp/components'
import { SidebarProvider, useSidebar } from '@/components/ui/SidebarContext'
import { useTheme } from '@/components/ThemeContext'
import { ToastProvider } from '@/components/ToastContext'
import { useState, useEffect } from 'react'

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

      <div style={{ marginLeft: `${sidebarWidth}px` }} className="transition-all duration-300 flex flex-col min-h-screen">
        <UserHeader />

        <main className="p-6">
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
