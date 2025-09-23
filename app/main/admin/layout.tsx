// @/app/main/admin/layout.tsx - Updated
'use client'

import { AdminSidebar } from '@/components/ui/AdminSidebar'
import { AdminHeader } from '@/components/ui/AdminHeader'
import { RoleGuard } from '@/components/mainapp/components'
import { SidebarProvider, useSidebar } from '@/components/ui/SidebarContext'

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminSidebar />

      <div className={`${isCollapsed ? 'lg:ml-20' : 'lg:ml-72'} transition-all duration-300`}>
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
