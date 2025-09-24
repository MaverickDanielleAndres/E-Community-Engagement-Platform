// STEP 4: Add this component temporarily to force refresh the session
// @/components/ForceRefresh.tsx

'use client'

import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'

export function ForceRefresh() {
  const { data: session, update } = useSession()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkRole = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/user-role')
      const data = await response.json()
      setDebugInfo(data)
      console.log('🔍 DEBUG INFO:', data)
    } catch (error) {
      console.error('❌ ERROR:', error)
    } finally {
      setLoading(false)
    }
  }

  const forceSignOut = async () => {
    await signOut({ callbackUrl: '/auth/login' })
  }

  const updateSession = async () => {
    await update()
    window.location.reload()
  }

  return (
    <div className="fixed top-4 right-4 bg-black text-white p-4 rounded-lg max-w-md z-50">
      <h3 className="font-bold mb-2 text-yellow-300">🚨 DEBUG PANEL</h3>
      
      <div className="space-y-2 mb-4 text-xs">
        <div><strong>Session Role:</strong> {session?.user?.role || 'undefined'}</div>
        <div><strong>Session ID:</strong> {session?.user?.id || 'undefined'}</div>
        <div><strong>Current URL:</strong> {window.location.pathname}</div>
      </div>

      <div className="space-y-2">
        <button 
          onClick={checkRole}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
        >
          {loading ? 'Checking...' : 'Check DB Role'}
        </button>
        
        <button 
          onClick={updateSession}
          className="w-full bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
        >
          Force Session Update
        </button>
        
        <button 
          onClick={forceSignOut}
          className="w-full bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
        >
          Sign Out & Retry
        </button>
      </div>

      {debugInfo && (
        <details className="mt-4">
          <summary className="cursor-pointer text-yellow-300">Debug Details</summary>
          <div className="mt-2 text-xs bg-gray-800 p-2 rounded max-h-40 overflow-auto">
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        </details>
      )}
    </div>
  )
}