'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { EmptyState, ChartCard } from '@/components/mainapp/components'
import { useTheme } from '@/components/ThemeContext'
import { PieChart, Calendar, Users, CheckCircle, Clock, FileText, MessageSquare } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface PollQuestion {
  id: string
  type: 'radio' | 'checkbox' | 'text'
  question: string
  options?: string[]
  required: boolean
  responses: any[]
}

interface PollData {
  id: string
  title: string
  description: string
  deadline: string
  created_at: string
  is_anonymous: boolean
  questions: PollQuestion[]
  footer_note?: string
  complaint_link?: string
  status: 'active' | 'closed'
  user_voted: boolean
  user_responses: Record<string, any>
}

export default function UserPollDetails() {
  const params = useParams()
  const router = useRouter()
  const { isDark } = useTheme()
  const pollId = params.pollId as string
  const [poll, setPoll] = useState<PollData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [responses, setResponses] = useState<Record<string, any>>({})

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const response = await fetch(`/api/polls/${pollId}`)
        if (response.ok) {
          const data = await response.json()
          setPoll(data.poll)
          // Set existing responses if user already voted
          if (data.poll?.user_responses) {
            setResponses(data.poll.user_responses)
          }
        }
      } catch (error) {
        console.error('Failed to fetch poll:', error)
      } finally {
        setLoading(false)
      }
    }

    if (pollId) {
      fetchPoll()
    }
  }, [pollId])

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleSubmit = async () => {
    if (!poll) return

    // Validate required questions
    const missingRequired = poll.questions.filter(q =>
      q.required && (!responses[q.id] || responses[q.id].toString().trim() === '')
    )

    if (missingRequired.length > 0) {
      alert(`Please answer all required questions: ${missingRequired.map(q => q.question).join(', ')}`)
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/polls/${pollId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses }),
      })

      if (response.ok) {
        // Refresh poll data
        const updatedResponse = await fetch(`/api/polls/${pollId}`)
        if (updatedResponse.ok) {
          const data = await updatedResponse.json()
          setPoll(data.poll)
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to submit response')
      }
    } catch (error) {
      console.error('Failed to submit:', error)
      alert('Failed to submit response')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!poll) {
    return (
      <EmptyState
        title="Poll not found"
        description="The poll you're looking for doesn't exist or has been removed"
        icon={PieChart}
      />
    )
  }

  const canRespond = poll.status === 'active' && (!poll.deadline || new Date(poll.deadline) > new Date())
  const isExpired = poll.deadline && new Date(poll.deadline) < new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {poll.title}
          </h1>
          {poll.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {poll.description}
            </p>
          )}
        </div>

        <div className="mt-4 sm:mt-0 sm:ml-6">
          <div className="flex items-center space-x-2">
            {isExpired && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                <Clock className="w-4 h-4 mr-1" />
                Expired
              </span>
            )}
            {poll.user_voted && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle className="w-4 h-4 mr-1" />
                You've responded
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Poll Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center">
            <Users className="w-6 h-6 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Questions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{poll.questions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center">
            <Calendar className="w-6 h-6 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {new Date(poll.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center">
            <Clock className="w-6 h-6 text-orange-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Deadline</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {poll.deadline ? new Date(poll.deadline).toLocaleDateString() : 'No deadline'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Response Form */}
      {canRespond && !poll.user_voted && !isExpired && (
        <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Answer the Questions
          </h2>

          <div className="space-y-8">
            {poll.questions.map((question, index) => (
              <div key={question.id} className="space-y-3">
                <div className="flex items-start">
                  <span className="text-sm font-medium text-gray-900 dark:text-white mr-2">
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">
                      {question.question}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </h3>

                    {question.type === 'radio' && question.options && (
                      <div className="mt-3 space-y-2">
                        {question.options.map((option, optIndex) => (
                          <label key={optIndex} className="flex items-center">
                            <input
                              type="radio"
                              name={question.id}
                              value={option}
                              checked={responses[question.id] === option}
                              onChange={(e) => handleResponseChange(question.id, e.target.value)}
                              className="mr-3"
                            />
                            <span className="text-gray-700 dark:text-gray-300">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {question.type === 'checkbox' && question.options && (
                      <div className="mt-3 space-y-2">
                        {question.options.map((option, optIndex) => (
                          <label key={optIndex} className="flex items-center">
                            <input
                              type="checkbox"
                              value={option}
                              checked={(responses[question.id] || []).includes(option)}
                              onChange={(e) => {
                                const current = responses[question.id] || []
                                const updated = e.target.checked
                                  ? [...current, option]
                                  : current.filter((item: string) => item !== option)
                                handleResponseChange(question.id, updated)
                              }}
                              className="mr-3"
                            />
                            <span className="text-gray-700 dark:text-gray-300">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {question.type === 'text' && (
                      <textarea
                        value={responses[question.id] || ''}
                        onChange={(e) => handleResponseChange(question.id, e.target.value)}
                        placeholder="Enter your answer..."
                        className="mt-3 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        rows={3}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              * Required questions must be answered
            </p>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {submitting ? 'Submitting...' : 'Submit Response'}
            </button>
          </div>
        </div>
      )}

      {/* Already Responded */}
      {poll.user_voted && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                Response Submitted
              </h3>
              <p className="text-green-700 dark:text-green-300 mt-1">
                Thank you for participating in this poll. Your responses have been recorded.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Note */}
      {poll.footer_note && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-start">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-base font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Additional Information
              </h3>
              <p className="text-blue-700 dark:text-blue-300 whitespace-pre-wrap">
                {poll.footer_note}
              </p>
              {poll.complaint_link && (
                <a
                  href={poll.complaint_link}
                  className="inline-flex items-center mt-3 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Submit a complaint
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Poll Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Poll Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <CheckCircle className={`w-4 h-4 mr-2 ${poll.is_anonymous ? 'text-green-500' : 'text-gray-400'}`} />
            <span className="text-gray-700 dark:text-gray-300">
              Anonymous responses {poll.is_anonymous ? 'enabled' : 'disabled'}
            </span>
          </div>

          <div className="flex items-center">
            <CheckCircle className={`w-4 h-4 mr-2 ${poll.questions.some(q => q.type === 'checkbox') ? 'text-green-500' : 'text-gray-400'}`} />
            <span className="text-gray-700 dark:text-gray-300">
              Multiple choice questions {poll.questions.some(q => q.type === 'checkbox') ? 'included' : 'not included'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
