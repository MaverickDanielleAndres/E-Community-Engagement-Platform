'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { EmptyState, ChartCard } from '@/components/mainapp/components'
import { useTheme } from '@/components/ThemeContext'
import { PieChart, Calendar, Users, CheckCircle, Clock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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
  status: 'active' | 'closed'
  user_voted: boolean
  user_votes: string[]
}

export default function UserPollDetails() {
  const params = useParams()
  const router = useRouter()
  const { isDark } = useTheme()
  const pollId = params.pollId as string
  const [poll, setPoll] = useState<PollData | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const response = await fetch(`/api/polls/${pollId}`)
        if (response.ok) {
          const data = await response.json()
          setPoll(data.poll)
          // Set pre-selected options if user already voted
          if (data.poll?.user_votes) {
            setSelectedOptions(data.poll.user_votes)
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

  const handleOptionChange = (optionId: string) => {
    if (!poll) return

    if (poll.is_multi_select) {
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      )
    } else {
      setSelectedOptions([optionId])
    }
  }

  const handleVote = async () => {
    if (!poll || selectedOptions.length === 0) return

    setVoting(true)
    try {
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ 
          optionIds: selectedOptions 
        }),
      })
      
      if (response.ok) {
        // Refresh poll data to show updated results
        const updatedResponse = await fetch(`/api/polls/${pollId}`)
        if (updatedResponse.ok) {
          const data = await updatedResponse.json()
          setPoll(data.poll)
        }
      }
    } catch (error) {
      console.error('Failed to vote:', error)
    }
    setVoting(false)
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

  const canVote = poll.status === 'active' && (!poll.deadline || new Date(poll.deadline) > new Date())
  const isExpired = poll.deadline && new Date(poll.deadline) < new Date()

  const chartData = poll.options.map(option => ({
    name: option.option_text.length > 30 ? option.option_text.substring(0, 30) + '...' : option.option_text,
    votes: option.vote_count,
    percentage: poll.total_votes > 0 ? ((option.vote_count / poll.total_votes) * 100).toFixed(1) : 0
  }))

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
        
        {canVote && !poll.user_voted && (
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
                  You've voted
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Poll Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center">
            <Users className="w-6 h-6 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Votes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{poll.total_votes}</p>
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

      {/* Voting Section */}
      {canVote && !poll.user_voted && !isExpired && (
        <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Cast Your Vote
          </h2>
          
          <div className="space-y-3">
            {poll.options.map((option, index) => (
              <label
                key={option.id}
                className={`
                  flex items-center p-4 rounded-lg border cursor-pointer transition-all duration-200
                  ${selectedOptions.includes(option.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }
                `}
              >
                <input
                  type={poll.is_multi_select ? 'checkbox' : 'radio'}
                  name="poll-option"
                  value={option.id}
                  checked={selectedOptions.includes(option.id)}
                  onChange={() => handleOptionChange(option.id)}
                  className="mr-3"
                />
                <span className="flex-1 font-medium text-gray-900 dark:text-white">
                  {index + 1}. {option.option_text}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {poll.is_multi_select ? 'Select multiple options' : 'Select one option'}
            </p>
            
            <button
              onClick={handleVote}
              disabled={voting || selectedOptions.length === 0}
              className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {voting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {voting ? 'Voting...' : 'Submit Vote'}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
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
                height={80}
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
            const isUserChoice = selectedOptions.includes(option.id) || poll.user_votes?.includes(option.id)
            
            return (
              <div key={option.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${isUserChoice ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                    {index + 1}. {option.option_text}
                    {isUserChoice && ' ✓'}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {option.vote_count} votes ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isUserChoice ? 'bg-blue-600' : 'bg-gray-400'
                    }`}
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

      {/* Poll Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Poll Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <CheckCircle className={`w-4 h-4 mr-2 ${poll.is_anonymous ? 'text-green-500' : 'text-gray-400'}`} />
            <span className="text-gray-700 dark:text-gray-300">
              Anonymous voting {poll.is_anonymous ? 'enabled' : 'disabled'}
            </span>
          </div>
          
          <div className="flex items-center">
            <CheckCircle className={`w-4 h-4 mr-2 ${poll.is_multi_select ? 'text-green-500' : 'text-gray-400'}`} />
            <span className="text-gray-700 dark:text-gray-300">
              Multiple selections {poll.is_multi_select ? 'allowed' : 'not allowed'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}