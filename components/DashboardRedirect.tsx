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
      // Fetch user role and redirect to appropriate dashboard
      fetch('/api/me/summary')
        .then(response => response.json())
        .then(data => {
          let redirectPath = ''
          const role = data.user.role.toLowerCase()
          switch (role) {
            case 'admin':
              redirectPath = '/main/admin'
              break
            case 'resident':
              redirectPath = '/main/user'
              break
            case 'guest':
              redirectPath = '/main/guest'
              break
            default:
              redirectPath = '/'
          }
          router.push(redirectPath)
        })
        .catch(error => {
          // Fallback to home if role fetch fails
          router.push('/')
        })
    }
  }, [session, status, router])

  return null
}
