// @/components/RoleDebugger.tsx
'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

interface ApiResponse {
  user?: {
    id: string
    name: string
    email: string
    role: string
    community: string
  }
  stats?: any
  error?: string
  details?: any
}

export function RoleDebugger() {
  const { data: session, status } = useSession()
  const [apiData, setApiData] = useState<ApiResponse | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchApiData = async () => {
    setIsLoading(true)
    setApiError(null)
    try {
      console.log('Fetching /api/me/summary...')
      const response = await fetch('/api/me/summary', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Important for cookies
      })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('API Response data:', data)
      setApiData(data)
    } catch (error) {
      console.error('API Error:', error)
      setApiError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchApiData()
    }
  }, [status])

  if (status === 'loading') {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-md">
        <h3 className="font-bold text-yellow-400 mb-2">Debug Info</h3>
        <p>Loading session...</p>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-md">
      <h3 className="font-bold text-yellow-400 mb-2">Debug Info</h3>
      <div className="text-xs space-y-1">
        <div><strong>Session Status:</strong> {status}</div>
        <div><strong>Session Role:</strong> {(session as any)?.user?.role || 'not found'}</div>
        <div><strong>Session Email:</strong> {session?.user?.email || 'not found'}</div>
        <div><strong>API Role:</strong> {
          isLoading ? 'loading...' : 
          apiError ? `error: ${apiError}` : 
          apiData?.user?.role || 'not fetched'
        }</div>
        <div><strong>User ID:</strong> {
          (session as any)?.user?.id?.substring(0, 8) || 'not found'
        }...</div>
        <div><strong>Community:</strong> {
          apiData?.user?.community || 'not fetched'
        }</div>
        
        <button 
          onClick={fetchApiData}
          disabled={isLoading}
          className="mt-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Refresh API'}
        </button>
        
        <details className="mt-2">
          <summary className="cursor-pointer text-yellow-400">Full Session</summary>
          <pre className="text-xs mt-2 bg-gray-800 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(session, null, 2)}
          </pre>
        </details>
        
        <details className="mt-2">
          <summary className="cursor-pointer text-yellow-400">Full API Response</summary>
          <pre className="text-xs mt-2 bg-gray-800 p-2 rounded overflow-auto max-h-40">
            {apiError ? `Error: ${apiError}` : JSON.stringify(apiData, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  )
}