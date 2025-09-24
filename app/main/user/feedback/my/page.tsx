// @/app/main/user/feedback/my/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/mainapp/components'
import { Star, Calendar } from 'lucide-react'

interface Feedback {
  id: string
  rating: number
  comment: string
  created_at: string
}

export default function MyFeedback() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await fetch('/api/feedback?my=true')
        if (response.ok) {
          const data = await response.json()
          setFeedback(data.feedback || [])
        }
      } finally {
        setLoading(false)
      }
    }
    fetchFeedback()
  }, [])

  const renderStars = (rating: number) => (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        />
      ))}
    </div>
  )

  const columns = [
    {
      key: 'rating' as const,
      header: 'Rating',
      render: (value: number) => renderStars(value)
    },
    {
      key: 'comment' as const,
      header: 'Comment',
      render: (value: string) => value || <span className="italic text-gray-400">No comment</span>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Feedback</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">View your submitted feedback history</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <DataTable
          data={feedback}
          columns={columns}
          loading={loading}
          emptyMessage="You haven't submitted any feedback yet"
        />
      </div>
    </div>
  )
}
