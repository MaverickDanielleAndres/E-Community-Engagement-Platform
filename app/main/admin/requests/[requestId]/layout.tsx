import AdminLayout from '@/app/main/admin/layout'

interface RequestLayoutProps {
  children: ReactNode
  modals: ReactNode
}

export default function RequestLayout({ children, modals }: RequestLayoutProps) {
  return (
    <AdminLayout>
      {children}
      {modals}
    </AdminLayout>
  )
}
