// @/components/RoleDebug.tsx (Temporary component for debugging)
'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

export function RoleDebug() {
  const { data: session, status } = useSession()
  const [apiData, setApiData] = useState<any>(null)

  useEffect(() => {
    if (session) {
      fetch('/api/me/summary')
        .then(res => res.json())
        .then(data => setApiData(data))
        .catch(err => console.error('API Error:', err))
    }
  }, [session])

  if (status === 'loading') return <div>Loading...</div>

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg max-w-sm text-xs">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div>
        <strong>Session Status:</strong> {status}<br />
        <strong>Session Role:</strong> {session?.user?.role || 'undefined'}<br />
        <strong>API Role:</strong> {apiData?.user?.role || 'not fetched'}<br />
        <strong>User ID:</strong> {session?.user?.id || 'undefined'}<br />
        <strong>Community:</strong> {apiData?.user?.community || 'not fetched'}
      </div>
      {apiData && (
        <details className="mt-2">
          <summary>Full API Response</summary>
          <pre className="mt-1 text-xs">{JSON.stringify(apiData, null, 2)}</pre>
        </details>
      )}
    </div>
  )
}