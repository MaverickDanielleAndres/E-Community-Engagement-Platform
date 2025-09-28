// @/app/main/guest/layout.tsx
'use client'

import { GuestSidebar } from '@/components/ui/GuestSidebar'
import { GuestHeader } from '@/components/ui/GuestHeader'
import { RoleGuard } from '@/components/mainapp/components'
import { SidebarProvider, useSidebar } from '@/components/ui/SidebarContext'

function GuestLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <GuestSidebar />

      <div className={`${isCollapsed ? 'ml-[80px]' : 'ml-[320px]'} transition-all duration-300`}>
        <GuestHeader />

        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={['Guest', 'Resident', 'Admin']}>
      <SidebarProvider>
        <GuestLayoutContent>{children}</GuestLayoutContent>
      </SidebarProvider>
    </RoleGuard>
  )
}
