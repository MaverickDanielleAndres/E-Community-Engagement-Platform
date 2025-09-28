// app/main/admin/polls/[pollId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ChartCard, EmptyState, ConfirmDialog } from '@/components/mainapp/components'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { PieChart, Calendar, Users, AlertTriangle, CheckCircle, FileText, MessageSquare } from 'lucide-react'

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
  totalResponses?: number
}

export default function PollDetails() {
  const params = useParams()
  const pollId = params.pollId as string
  const [poll, setPoll] = useState<PollData | null>(null)
  const [loading, setLoading] = useState(true)
  const [closeDialog, setCloseDialog] = useState(false)

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const response = await fetch(`/api/polls/${pollId}`)
        if (response.ok) {
          const data = await response.json()
          setPoll(data.poll)
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

  const handleClosePoll = async () => {
    try {
      const response = await fetch(`/api/polls/${pollId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'closed' }),
      })

      if (response.ok) {
        // Refresh poll data to get updated status and responses
        const updatedResponse = await fetch(`/api/polls/${pollId}`)
        if (updatedResponse.ok) {
          const data = await updatedResponse.json()
          setPoll(data.poll)
        }
      }
    } catch (error) {
      console.error('Failed to close poll:', error)
    }
    setCloseDialog(false)
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
        description="The poll you're looking for doesn't exist or has been deleted"
        icon={PieChart}
      />
    )
  }

  // Use total responses from API (number of unique respondents)
  const totalResponses = poll.totalResponses || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {poll.title}
          </h1>
          {poll.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {poll.description}
            </p>
          )}
        </div>

        {poll.status === 'active' && (
          <button
            onClick={() => setCloseDialog(true)}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Close Poll
          </button>
        )}
      </div>

      {/* Poll Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center">
            <Users className="w-5 h-5 text-blue-500 mr-2" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Responses</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{totalResponses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center">
            <PieChart className="w-5 h-5 text-green-500 mr-2" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Questions</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{poll.questions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center">
            <CheckCircle className={`w-5 h-5 mr-2 ${poll.status === 'active' ? 'text-green-500' : 'text-red-500'}`} />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {poll.status}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-orange-500 mr-2" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Deadline</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {poll.deadline ? new Date(poll.deadline).toLocaleDateString() : 'No deadline'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Questions and Results */}
      {poll.questions.map((question, questionIndex) => {
        const responses = question.responses || []
        const responseCount = responses.length

        return (
          <div key={question.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Question {questionIndex + 1}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">{question.question}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Type: {question.type} • {responseCount} responses
                </p>
              </div>
            </div>

            {/* Question Results */}
            {question.type === 'radio' && question.options && (
              <div className="space-y-4">
                {question.options.map((option, optionIndex) => {
                  const optionResponses = responses.filter((r: any) => r === option).length
                  const percentage = responseCount > 0 ? (optionResponses / responseCount) * 100 : 0

                  return (
                    <div key={optionIndex} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {option}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {optionResponses} responses ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {question.type === 'checkbox' && question.options && (
              <div className="space-y-4">
                {question.options.map((option, optionIndex) => {
                  const optionResponses = responses.filter((r: any[]) => r && r.includes(option)).length
                  const percentage = responseCount > 0 ? (optionResponses / responseCount) * 100 : 0

                  return (
                    <div key={optionIndex} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {option}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {optionResponses} responses ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {question.type === 'text' && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Text Responses:</h4>
                {responses.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {responses.slice(0, 10).map((response: string, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{response || 'No response'}</p>
                      </div>
                    ))}
                    {responses.length > 10 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        ... and {responses.length - 10} more responses
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No responses yet</p>
                )}
              </div>
            )}

            {responseCount === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                No responses yet for this question
              </p>
            )}
          </div>
        )
      })}

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

      {/* Close Poll Confirmation */}
      <ConfirmDialog
        isOpen={closeDialog}
        onClose={() => setCloseDialog(false)}
        onConfirm={handleClosePoll}
        title="Close Poll"
        description="Are you sure you want to close this poll? Once closed, no more votes can be cast."
        confirmLabel="Close Poll"
        variant="danger"
      />
    </div>
  )
}