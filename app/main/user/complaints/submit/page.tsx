// @/app/main/user/complaints/submit/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/ThemeContext'
import { Send, AlertTriangle } from 'lucide-react'

export default function SubmitComplaint() {
  const router = useRouter()
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/main/user/complaints/my')
      }
    } catch (error) {
      console.error('Error submitting complaint:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Submit Complaint
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Report issues or concerns to the community administrators
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-300'}`}
                placeholder="Brief description of the issue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-300'}`}
              >
                <option value="maintenance">Maintenance</option>
                <option value="governance">Governance</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                required
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-300'}`}
                placeholder="Provide detailed information about your complaint..."
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className={`px-4 py-2 border rounded-lg ${isDark ? 'border-slate-600 hover:bg-slate-700' : 'border-slate-300 hover:bg-gray-50'}`}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </div>
      </form>
    </div>
  )
}
