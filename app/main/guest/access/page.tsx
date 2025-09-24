
// @/app/main/guest/access/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/ThemeContext'
import { Key, ArrowRight, Users } from 'lucide-react'

export default function GuestAccess() {
  const router = useRouter()
  const { isDark } = useTheme()
  const [communityCode, setCommunityCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!communityCode.trim()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/community/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: communityCode.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        // Redirect to signup or login with community info
        router.push(`/auth/signup?community=${data.community.id}&code=${communityCode}`)
      } else {
        setError('Invalid community code')
      }
    } catch (error) {
      setError('Failed to validate code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <Key className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Join a Community
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Enter your community access code to get started
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Community Code
          </label>
          <input
            type="text"
            required
            value={communityCode}
            onChange={(e) => setCommunityCode(e.target.value.toUpperCase())}
            placeholder="Enter code (e.g., PALATIW-001)"
            className={`w-full px-4 py-3 rounded-lg border text-center font-mono text-lg ${
              isDark 
                ? 'bg-slate-700 border-slate-600 text-white' 
                : 'bg-white border-slate-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-2">{error}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !communityCode.trim()}
          className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          ) : (
            <ArrowRight className="w-5 h-5 mr-2" />
          )}
          {loading ? 'Validating...' : 'Continue'}
        </button>
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Don't have a community code?{' '}
          <button className="text-blue-600 dark:text-blue-400 hover:underline">
            Contact your community administrator
          </button>
        </p>
      </div>

      <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center mb-2">
          <Users className="w-4 h-4 text-gray-500 mr-2" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">What happens next?</h3>
        </div>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Validate your community code</li>
          <li>• Create your account</li>
          <li>• Start participating in community decisions</li>
        </ul>
      </div>
    </div>
  )
}