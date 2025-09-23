// @/app/main/guest/layout.tsx
import { RoleGuard } from '@/components/mainapp/components'

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={['Guest', 'Resident', 'Admin']}>
      {children}
    </RoleGuard>
  )
}