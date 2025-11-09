// @/app/main/admin/layout.tsx - Updated
'use client'

import { AdminSidebar } from '@/components/ui/AdminSidebar'
import { AdminHeader } from '@/components/ui/AdminHeader'
import { RoleGuard } from '@/components/mainapp/components'
import { SidebarProvider, useSidebar } from '@/components/ui/SidebarContext'
import { useTheme } from '@/components/ThemeContext'
import { useState, useEffect } from 'react'

export function AdminLayoutContent({ children }: { children: React.ReactNode }) {
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
      <AdminSidebar />

      <div className="flex flex-col min-h-screen">
        <AdminHeader />
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={['Admin']}>
      <SidebarProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </SidebarProvider>
    </RoleGuard>
  )
}
