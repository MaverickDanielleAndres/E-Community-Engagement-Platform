import { ReactNode } from 'react'

interface RequestLayoutProps {
  children: ReactNode
  modals: ReactNode
}

export default function RequestLayout({ children, modals }: RequestLayoutProps) {
  return (
    <>
      {children}
      {modals}
    </>
  )
}
