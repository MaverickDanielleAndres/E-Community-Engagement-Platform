// @/app/main/user/feedback/my/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/mainapp/components'
import { Star, Calendar } from 'lucide-react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { useTheme } from '@/components/ThemeContext'
import { refreshHeaderAndSidebar } from '@/components/utils/refresh'

interface Feedback {
  id: string
  rating?: number
  comment?: string
  form_data?: Record<string, any>
  resolved_details?: string
  created_at: string
}

export default function MyFeedback() {
  const { isDark } = useTheme()
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10

  const fetchFeedback = async (pageNumber: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/feedback?my=true&page=${pageNumber}&limit=${limit}`)
      if (response.ok) {
        const data = await response.json()
        setFeedback(data.feedback || [])
        setTotal(data.total || 0)
        setPage(data.page || 1)
      }
    } catch (error) {
      console.error('Failed to fetch feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedback(page)
  }, [page])

  const refreshFeedback = async () => {
    fetchFeedback(page)
    // Refresh header and sidebar data
    refreshHeaderAndSidebar()
  }

  const renderRating = (feedback: Feedback) => {
    // Handle new form_data structure
    if (feedback.form_data && feedback.form_data.rating) {
      const rating = feedback.form_data.rating
      const emojis = ['😡', '😞', '😐', '😊', '😄']
      return (
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{emojis[rating - 1] || '⭐'}</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {rating}/5
          </span>
        </div>
      )
    }
    
    // Fallback to old rating structure
    if (feedback.rating) {
      return (
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${star <= feedback.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            />
          ))}
        </div>
      )
    }
    
    return <span className="text-gray-400">No rating</span>
  }

  const renderDetails = (feedback: Feedback) => {
    // Map keys to human-readable labels
    const keyLabelMap: { [key: string]: string } = {
      '1758811812392': 'Feedback For',
      '1758901149505': 'Rating',
      '1758901200811': 'Option Selected',
      '1759651257753': 'Confirmation',
      // Add more mappings as needed
    }

    // Use resolved_details if available
    if (feedback.resolved_details) {
      return feedback.resolved_details
    }

    // Handle new form_data structure
    if (feedback.form_data) {
      const commentField = Object.entries(feedback.form_data).find(([key, value]) => 
        key.toLowerCase().includes('comment') && typeof value === 'string' && value.length > 0
      )
      if (commentField) {
        return commentField[1]
      }
      
      // Show other form fields as structured data, filtering out UUIDs
      const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
      
      const otherFields = Object.entries(feedback.form_data)
        .filter(([key, value]) => 
          !key.toLowerCase().includes('rating') &&
          typeof value === 'string' &&
          value.length > 0 &&
          !isUUID(value)
        )
        .map(([key, value]) => `${keyLabelMap[key] || key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
        .join(', ');
      
      return otherFields || <span className="italic text-gray-400">Form data submitted</span>
    }
    
    // Fallback to old comment structure
    return feedback.comment || <span className="italic text-gray-400">No comment</span>
  }

  const columns = [
    {
      key: 'rating' as const,
      header: 'Rating',
      render: (_: any, feedback: Feedback) => renderRating(feedback)
    },
    {
      key: 'comment' as const,
      header: 'Details',
      render: (_: any, feedback: Feedback) => renderDetails(feedback)
    },
    {
      key: 'created_at' as const,
      header: 'Date',
      render: (value: string) => (
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4 mr-1" />
          {new Date(value).toLocaleDateString()}
        </div>
      )
    }
  ]

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Feedback</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">View your submitted feedback history</p>
        </div>
        <button
          onClick={refreshFeedback}
          disabled={loading}
          title="Refresh feedback"
          className={`p-2 rounded-md transition-colors ${
            isDark
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          } ${loading ? 'animate-spin' : ''}`}
        >
          <ArrowPathIcon className="w-5 h-5" />
        </button>
      </div>

      <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <DataTable
          data={feedback}
          columns={columns}
          loading={loading}
          emptyMessage="You haven't submitted any feedback yet"
        />
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setPage(pageNum)}
              disabled={loading || pageNum === page}
              className={`px-3 py-1 rounded-md border ${
                pageNum === page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-100'
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
