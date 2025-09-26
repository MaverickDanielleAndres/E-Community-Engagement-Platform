// @/app/main/user/layout.tsx - Updated
'use client'

import { UserSidebar } from '@/components/ui/UserSidebar'
import { UserHeader } from '@/components/ui/UserHeader'
import { RoleGuard } from '@/components/mainapp/components'
import { SidebarProvider, useSidebar } from '@/components/ui/SidebarContext'

function UserLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <UserSidebar />

      <div className={`${isCollapsed ? 'ml-[80px]' : 'ml-[320px]'} transition-all duration-300`}>
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
      <SidebarProvider>
        <UserLayoutContent>{children}</UserLayoutContent>
      </SidebarProvider>
    </RoleGuard>
  )
}
