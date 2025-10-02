import { RoleGuard } from '@/components/mainapp/components'

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={['guest', 'resident', 'admin']}>
      {children}
    </RoleGuard>
  )
}
