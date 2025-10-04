// @/app/main/admin/layout.tsx - Updated
'use client'

import { AdminSidebar } from '@/components/ui/AdminSidebar'
import { AdminHeader } from '@/components/ui/AdminHeader'
import { RoleGuard } from '@/components/mainapp/components'
import { SidebarProvider, useSidebar } from '@/components/ui/SidebarContext'
import { useTheme } from '@/components/ThemeContext'

export function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()
  const { isDark } = useTheme()

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <AdminSidebar />

      <div className={`${isCollapsed ? 'ml-[80px]' : 'ml-[320px]'} transition-all duration-300`}>
        <AdminHeader />

        <main className="p-6">
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
