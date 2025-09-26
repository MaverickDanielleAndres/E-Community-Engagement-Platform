import { RoleGuard } from '@/components/mainapp/components'

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={['Resident', 'Admin']}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {children}
      </div>
    </RoleGuard>
  )
}
