// @/components/DashboardRedirect.tsx
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function DashboardRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated' && session) {
      // Redirect authenticated users to dashboard
      router.push('/dashboard')
    }
  }, [session, status, router])

  return null
}