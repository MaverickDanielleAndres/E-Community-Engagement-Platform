'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ChartCard, EmptyState, ConfirmDialog } from '@/components/mainapp/components'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { PieChart, Calendar, Users, AlertTriangle, CheckCircle } from 'lucide-react'

interface PollData {
  id: string
  title: string
  description: string
  deadline: string
  created_at: string
  is_anonymous: boolean
  is_multi_select: boolean
  options: Array<{
    id: string
    option_text: string
    vote_count: number
  }>
  total_votes: number
  status: 'active' | 'closed' | 'draft'
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
        setPoll(prev => prev ? { ...prev, status: 'closed' } : null)
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

  const chartData = poll.options.map(option => ({
    name: option.option_text.length > 20 ? option.option_text.substring(0, 20) + '...' : option.option_text,
    votes: option.vote_count,
    percentage: poll.total_votes > 0 ? ((option.vote_count / poll.total_votes) * 100).toFixed(1) : 0
  }))

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
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Votes</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{poll.total_votes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-green-500 mr-2" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date(poll.created_at).toLocaleDateString()}
              </p>
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

      {/* Results Chart */}
      <ChartCard title="Poll Results">
        {poll.total_votes > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                stroke="#6B7280"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
                formatter={(value: any, name: string) => [`${value} votes (${chartData.find(d => d.votes === value)?.percentage}%)`, 'Votes']}
              />
              <Bar dataKey="votes" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12">
            <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No votes yet</p>
          </div>
        )}
      </ChartCard>

      {/* Detailed Results */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Detailed Results
        </h2>
        
        <div className="space-y-4">
          {poll.options.map((option, index) => {
            const percentage = poll.total_votes > 0 ? (option.vote_count / poll.total_votes) * 100 : 0
            
            return (
              <div key={option.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {index + 1}. {option.option_text}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {option.vote_count} votes ({percentage.toFixed(1)}%)
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

        {poll.total_votes === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            No votes have been cast yet
          </p>
        )}
      </div>

      {/* Settings Info */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Poll Settings
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <CheckCircle className={`w-4 h-4 mr-2 ${poll.is_anonymous ? 'text-green-500' : 'text-gray-400'}`} />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Anonymous voting {poll.is_anonymous ? 'enabled' : 'disabled'}
            </span>
          </div>
          
          <div className="flex items-center">
            <CheckCircle className={`w-4 h-4 mr-2 ${poll.is_multi_select ? 'text-green-500' : 'text-gray-400'}`} />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Multiple selections {poll.is_multi_select ? 'allowed' : 'not allowed'}
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