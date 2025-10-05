// app/main/admin/feedback/[feedbackId]/page.tsx

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { EmptyState } from '@/components/mainapp/components'
import { useTheme } from '@/components/ThemeContext'
import { MessageSquare, User, Calendar, Star, Eye, ArrowLeft } from 'lucide-react'

interface FeedbackData {
  id: string
  rating: number
  comment: string
  form_data?: any
  template_id: string
  created_at: string
  resolved_details: string
  users: { name: string; email: string }
}

export default function FeedbackDetails() {
  const params = useParams()
  const feedbackId = params.feedbackId as string
  const { isDark } = useTheme()
  const [feedback, setFeedback] = useState<FeedbackData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await fetch(`/api/feedback/${feedbackId}`)
        if (response.ok) {
          const data = await response.json()
          setFeedback(data.feedback)
        } else if (response.status === 404) {
          console.error('Feedback not found:', feedbackId)
          setFeedback(null)
        } else {
          console.error('Failed to fetch feedback:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Failed to fetch feedback:', error)
      } finally {
        setLoading(false)
      }
    }

    if (feedbackId) {
      fetchFeedback()
    }
  }, [feedbackId])

  const renderStars = (rating: number) => (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 ${
            star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!feedback) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <MessageSquare className={`w-16 h-16 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
        <div className="text-center">
          <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Feedback not found
          </h2>
          <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            The feedback you're looking for doesn't exist or has been deleted.
          </p>
          <Link
            href="/main/admin/feedback"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Back to Feedback List
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={`text-2xl font-bold text-gray-900 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Feedback Details
          </h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Feedback #{feedback.id.slice(0, 8)}
          </p>
        </div>
        <button
          onClick={() => window.history.back()}
          className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isDark ? 'text-white border-gray-600 hover:bg-gray-700' : 'text-gray-700'
          }`}
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
      </div>

      {/* Feedback Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-500" />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Rating</p>
              <div className="flex items-center space-x-2">
                {renderStars(feedback.rating)}
                <span className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {feedback.rating}/5
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-500" />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Submitted By</p>
              <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {feedback.users.name}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-green-500" />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Submitted</p>
              <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {new Date(feedback.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Details */}
      <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        {/* Removed the "Feedback Details" header */}
        <div className="space-y-4">
          <div>
            {/* Removed the "Details" subheader */}
            <div className="space-y-2">
              {feedback.resolved_details.split('. ').filter(item => item.trim()).map((item, index) => {
                const [label, ...valueParts] = item.split(': ');
                const value = valueParts.join(': ');
                return (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-start">
                    <span className={`font-medium min-w-0 sm:min-w-[200px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {label}:
                    </span>
                    <span className={`leading-relaxed ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {feedback.comment && feedback.comment !== feedback.resolved_details && (
            <div>
              {/* Removed the "Additional Comment" subheader */}
              <p className={`leading-relaxed ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {feedback.comment}
              </p>
            </div>
          )}

          <div className="flex items-center pt-4 border-t border-slate-200 dark:border-slate-700">
            <User className="w-5 h-5 mr-2 text-gray-400" />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Submitted by</p>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {feedback.users.name} ({feedback.users.email})
              </p>
            </div>
          </div>
        </div>
      </div>


    </div>
  )
}
