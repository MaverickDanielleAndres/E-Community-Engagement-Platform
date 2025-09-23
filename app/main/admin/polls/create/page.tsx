
// @/app/main/admin/polls/create/page.tsx - Updated with full functionality
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/ThemeContext'
import { Toast } from '@/components/Toast'
import { Plus, X, Calendar, Save } from 'lucide-react'

interface PollOption {
  id: string
  text: string
}

export default function CreatePoll() {
  const router = useRouter()
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    is_anonymous: false,
    is_multi_select: false
  })
  const [options, setOptions] = useState<PollOption[]>([
    { id: '1', text: '' },
    { id: '2', text: '' }
  ])

  const addOption = () => {
    const newOption = {
      id: Date.now().toString(),
      text: ''
    }
    setOptions([...options, newOption])
  }

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter(option => option.id !== id))
    }
  }

  const updateOption = (id: string, text: string) => {
    setOptions(options.map(option => 
      option.id === id ? { ...option, text } : option
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validate form
    const validOptions = options.filter(option => option.text.trim() !== '')
    if (!formData.title.trim()) {
      setToast({ message: 'Poll title is required', type: 'error' })
      setLoading(false)
      return
    }
    if (validOptions.length < 2) {
      setToast({ message: 'At least 2 options are required', type: 'error' })
      setLoading(false)
      return
    }

    try {
      const pollData = {
        ...formData,
        options: validOptions.map(option => option.text)
      }

      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pollData),
      })

      if (response.ok) {
        setToast({ message: 'Poll created successfully', type: 'success' })
        setTimeout(() => {
          router.push('/main/admin/polls')
        }, 1500)
      } else {
        const errorData = await response.json()
        setToast({ message: errorData.error || 'Failed to create poll', type: 'error' })
      }
    } catch (error) {
      console.error('Error creating poll:', error)
      setToast({ message: 'Failed to create poll', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Create New Poll
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Create a poll to gather community opinions
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Basic Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Poll Title *
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`
                  w-full px-3 py-2 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${isDark 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-slate-300 text-gray-900'
                  }
                `}
                placeholder="Enter poll title"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`
                  w-full px-3 py-2 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${isDark 
                    ? 'bg-slate-700 border-slate-600 text-white' 
                    : 'bg-white border-slate-300 text-gray-900'
                  }
                `}
                placeholder="Optional description for the poll"
              />
            </div>

            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Deadline (Optional)
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  id="deadline"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className={`
                    w-full px-3 py-2 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${isDark 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-slate-300 text-gray-900'
                    }
                  `}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Poll Options */}
        <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Poll Options
            </h2>
            <button
              type="button"
              onClick={addOption}
              className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Option
            </button>
          </div>

          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={option.id} className="flex items-center space-x-3">
                <span className="text-sm text-gray-500 dark:text-gray-400 w-8">
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => updateOption(option.id, e.target.value)}
                  className={`
                    flex-1 px-3 py-2 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${isDark 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-slate-300 text-gray-900'
                    }
                  `}
                  placeholder={`Option ${index + 1}`}
                  required
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(option.id)}
                    className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Poll Settings */}
        <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Poll Settings
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_anonymous"
                checked={formData.is_anonymous}
                onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_anonymous" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Anonymous voting
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_multi_select"
                checked={formData.is_multi_select}
                onChange={(e) => setFormData({ ...formData, is_multi_select: e.target.checked })}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_multi_select" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Allow multiple selections
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className={`
              px-4 py-2 border rounded-lg transition-colors duration-200
              ${isDark 
                ? 'border-slate-600 text-gray-300 hover:bg-slate-700' 
                : 'border-slate-300 text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Creating...' : 'Create Poll'}
          </button>
        </div>
      </form>
    </div>
  )
}