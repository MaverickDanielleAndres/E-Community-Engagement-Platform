import { RoleGuard } from '@/components/mainapp/components'

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={['Resident', 'Admin']}>
      {children}
    </RoleGuard>
  )
}