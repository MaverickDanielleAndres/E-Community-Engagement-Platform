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
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDark ? 'border-blue-400' : 'border-blue-600'}`}></div>
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
    <div className={`space-y-6 bg-[#0f172a] ${isDark ? 'text-white' : 'text-black'}`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between ${isDark ? 'bg-[#0f172a]' : 'bg-[#0f172a]'}`}>
        <div className="flex-1">
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            {poll.title}
          </h1>
          {poll.description && (
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
              {poll.description}
            </p>
          )}
        </div>

        <div className="mt-4 sm:mt-0 sm:ml-6">
          <div className="flex items-center space-x-2">
            {isExpired && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
                <Clock className={`w-4 h-4 mr-1 ${isDark ? 'text-white' : 'text-black'}`} />
                Expired
              </span>
            )}
            {poll.user_voted && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`}>
                <CheckCircle className={`w-4 h-4 mr-1 ${isDark ? 'text-white' : 'text-black'}`} />
                You've responded
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Poll Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl border border-slate-200 dark:border-slate-700 p-6`}>
          <div className="flex items-center">
            <Users className={`w-6 h-6 mr-3 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Questions</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{poll.questions.length}</p>
            </div>
          </div>
        </div>

        <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl border border-slate-200 dark:border-slate-700 p-6`}>
          <div className="flex items-center">
            <Calendar className={`w-6 h-6 mr-3 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Created</p>
              <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {new Date(poll.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl border border-slate-200 dark:border-slate-700 p-6`}>
          <div className="flex items-center">
            <Clock className={`w-6 h-6 mr-3 ${isDark ? 'text-orange-400' : 'text-orange-500'}`} />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Deadline</p>
              <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {poll.deadline ? new Date(poll.deadline).toLocaleDateString() : 'No deadline'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Response Form */}
      {canRespond && !poll.user_voted && !isExpired && (
        <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
            Answer the Questions
          </h2>

          <div className="space-y-8">
            {poll.questions.map((question, index) => (
              <div key={question.id} className="space-y-3">
                <div className="flex items-start">
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} mr-2`}>
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    <h3 className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {question.question}
                      {question.required && <span className={`ml-1 ${isDark ? 'text-red-400' : 'text-red-500'}`}>*</span>}
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
                            <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{option}</span>
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
                            <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {question.type === 'text' && (
                      <textarea
                        value={responses[question.id] || ''}
                        onChange={(e) => handleResponseChange(question.id, e.target.value)}
                        placeholder="Enter your answer..."
                        className={`mt-3 w-full p-3 border rounded-lg ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                        rows={3}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              * Required questions must be answered
            </p>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200`}
            >
              {submitting ? (
                <div className={`animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2`}></div>
              ) : (
                <CheckCircle className={`w-4 h-4 mr-2 ${isDark ? 'text-white' : 'text-black'}`} />
              )}
              {submitting ? 'Submitting...' : 'Submit Response'}
            </button>
          </div>
        </div>
      )}

      {/* Already Responded */}
      {poll.user_voted && (
        <div className={`border rounded-xl p-6 ${isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center">
            <CheckCircle className={`w-6 h-6 mr-3 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            <div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-green-200' : 'text-green-800'}`}>
                Response Submitted
              </h3>
              <p className={`${isDark ? 'text-green-300' : 'text-green-700'} mt-1`}>
                Thank you for participating in this poll. Your responses have been recorded.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Note */}
      {poll.footer_note && (
        <div className={`border rounded-xl p-6 ${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-start">
            <FileText className={`w-5 h-5 mr-3 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <div>
              <h3 className={`text-base font-semibold mb-2 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                Additional Information
              </h3>
              <p className={`whitespace-pre-wrap ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                {poll.footer_note}
              </p>
              {poll.complaint_link && (
                <a
                  href={poll.complaint_link}
                  className={`inline-flex items-center mt-3 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                >
                  <MessageSquare className={`w-4 h-4 mr-1 ${isDark ? 'text-white' : 'text-black'}`} />
                  Submit a complaint
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Poll Settings */}
      <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl border border-slate-200 dark:border-slate-700 p-6`}>
        <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
          Poll Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <CheckCircle className={`w-4 h-4 mr-2 ${poll.is_anonymous ? (isDark ? 'text-green-400' : 'text-green-500') : (isDark ? 'text-gray-400' : 'text-gray-400')}`} />
            <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Anonymous responses {poll.is_anonymous ? 'enabled' : 'disabled'}
            </span>
          </div>

          <div className="flex items-center">
            <CheckCircle className={`w-4 h-4 mr-2 ${poll.questions.some(q => q.type === 'checkbox') ? (isDark ? 'text-green-400' : 'text-green-500') : (isDark ? 'text-gray-400' : 'text-gray-400')}`} />
            <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Multiple choice questions {poll.questions.some(q => q.type === 'checkbox') ? 'included' : 'not included'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
