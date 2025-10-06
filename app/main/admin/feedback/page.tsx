// @/app/main/admin/feedback/page.tsx - Updated with form editor and pagination
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DataTable, EmptyState, ChartCard, SearchInput } from '@/components/mainapp/components'
import { Smile, Star, User, Calendar, TrendingUp, Settings, Edit, Eye, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useTheme } from '@/components/ThemeContext'
import { Toast } from '@/components/Toast'
import FeedbackFormEditor from '@/components/ui/FeedbackFormEditor'


interface Feedback {
  id: string
  rating: number
  comment: string
  created_at: string
  form_data?: any
  users: { name: string; email: string }
}

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'responses' | 'form-editor'>('responses')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const { isDark } = useTheme()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalFeedback, setTotalFeedback] = useState(0)

  const fetchFeedback = async (page = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/feedback?page=${page}&limit=${pageSize}`)
      if (response.ok) {
        const data = await response.json()
        setFeedback(data.feedback || [])
        setTotalFeedback(data.total || 0)
        setCurrentPage(data.page || 1)
      } else {
        setToast({ message: 'Failed to load feedback', type: 'error' })
      }
    } catch (error) {
      console.error('Failed to fetch feedback:', error)
      setToast({ message: 'Failed to load feedback', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'responses') {
      fetchFeedback(currentPage)
    }
  }, [activeTab, currentPage])

  const getRatingStats = () => {
    const ratingLabels = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    }

    const ratings = [1, 2, 3, 4, 5].map(rating => ({
      rating: ratingLabels[rating as keyof typeof ratingLabels],
      count: feedback.filter(f => f.rating === rating).length,
      percentage: feedback.length > 0 ? ((feedback.filter(f => f.rating === rating).length / feedback.length) * 100).toFixed(1) : '0'
    }))

    return ratings
  }

  const getMonthlyTrend = () => {
    const monthlyData: { [key: string]: { total: number; sum: number } } = {}

    feedback.forEach(f => {
      const month = new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      if (!monthlyData[month]) {
        monthlyData[month] = { total: 0, sum: 0 }
      }
      monthlyData[month].total++
      monthlyData[month].sum += f.rating
    })

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      average: (data.sum / data.total).toFixed(2),
      count: data.total
    })).slice(-6)
  }

  const renderStars = (rating: number) => (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  )

  const columns: any = [
    {
      key: 'rating' as const,
      header: 'Rating',
      render: (value: number) => (
        <div className="flex items-center space-x-2">
          {renderStars(value)}
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>({value})</span>
        </div>
      )
    },
    {
      key: 'comment' as const,
      header: 'Comment',
      render: (value: string) => (
        <div className="max-w-xs">
          {value ? (
            <p className={`truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
          ) : (
            <span className="text-gray-400 italic">No comment</span>
          )}
        </div>
      )
    },
    {
      key: 'users' as const,
      header: 'Submitted By',
      render: (value: any) => (
        <div className="flex items-center text-sm">
          <User className="w-4 h-4 mr-2 text-gray-400" />
          <div>
            <div className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{value?.name}</div>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{value?.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'created_at' as const,
      header: 'Date',
      render: (value: string) => (
        <div className={`flex items-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <Calendar className="w-4 h-4 mr-1" />
          {new Date(value).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'action',
      header: 'Action',
      sortable: false,
      render: (_: any, row: Feedback) => (
        <Link
          href={`/main/admin/feedback/${row.id}`}
          className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <Eye className="w-4 h-4 mr-1" />
          View
        </Link>
      )
    }
  ]

  const filteredFeedback = feedback.filter(f =>
    f.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.users?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const averageRating = feedback.length > 0
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
    : '0'

  const TabButton = ({ tab, label, icon: Icon }: { tab: 'responses' | 'form-editor', label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${
        activeTab === tab
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
          : `${isDark ? 'bg-slate-700 text-gray-400 hover:bg-slate-600 hover:text-gray-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`
      }`}
      title={label}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline ml-2">{label}</span>
    </button>
  )

  // Pagination controls
  const totalPages = Math.ceil(totalFeedback / pageSize)

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className={`text-xl sm:text-2xl font-bold text-gray-900 ${isDark ? 'text-white' : 'text-slate-900'} break-words`}>
            Community Feedback
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm sm:text-base`}>
            Manage feedback forms and view community responses
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {activeTab === 'responses' && (
            <button
              onClick={() => fetchFeedback(currentPage)}
              disabled={loading}
              className={`p-2.5 rounded-xl border transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isDark
                  ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }
              `}
              title="Refresh feedback data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <TabButton tab="responses" label="View Responses" icon={Eye} />
          <TabButton tab="form-editor" label="Edit Form" icon={Edit} />
        </div>
      </div>

      {activeTab === 'responses' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl border ${isDark ? 'border-slate-700' : 'border-slate-200'} p-6`}>
              <div className="flex items-center">
                <Smile className="w-8 h-8 text-green-500 mr-3" />
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Average Rating</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{averageRating}/5</p>
                </div>
              </div>
            </div>

            <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl border ${isDark ? 'border-slate-700' : 'border-slate-200'} p-6`}>
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Feedback</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalFeedback}</p>
                </div>
              </div>
            </div>

            <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl border ${isDark ? 'border-slate-700' : 'border-slate-200'} p-6`}>
              <div className="flex items-center">
                <Star className="w-8 h-8 text-yellow-500 mr-3" />
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>5-Star Ratings</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {feedback.filter(f => f.rating === 5).length}
                  </p>
                </div>
              </div>
            </div>

            <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl border ${isDark ? 'border-slate-700' : 'border-slate-200'} p-6`}>
              <div className="flex items-center">
                <User className="w-8 h-8 text-purple-500 mr-3" />
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>With Comments</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {feedback.filter(f => f.comment && f.comment.trim() !== '').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <SearchInput
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={setSearchTerm}
              className="sm:max-w-md"
            />
          </div>

          {/* Feedback Table */}
          <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl border ${isDark ? 'border-slate-700' : 'border-slate-200'} overflow-hidden`}>
            {filteredFeedback.length === 0 && !loading ? (
              <EmptyState
                title="No feedback found"
                description="No feedback matches your current search"
                icon={Smile}
              />
            ) : (
              <DataTable
                data={filteredFeedback}
                columns={columns}
                loading={loading}
                emptyMessage="No feedback available"
              />
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} text-center sm:text-left`}>
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalFeedback)} of {totalFeedback} feedback entries
              </div>
              <div className="flex items-center space-x-2 justify-center sm:justify-end">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                    ${currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-slate-700 dark:text-gray-500'
                      : `${isDark ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                    }
                  `}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  <span className="hidden xs:inline">Previous</span>
                </button>

                <span className={`px-3 py-2 text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                    ${currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-slate-700 dark:text-gray-500'
                      : `${isDark ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                    }
                  `}
                >
                  <span className="hidden xs:inline">Next</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Rating Distribution">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getRatingStats()}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                  <XAxis dataKey="rating" stroke={isDark ? "#9CA3AF" : "#6B7280"} />
                  <YAxis stroke={isDark ? "#9CA3AF" : "#6B7280"} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      color: isDark ? '#F9FAFB' : '#111827'
                    }}
                    formatter={(value: any, name: string) => [`${value} responses (${getRatingStats().find(r => r.count === value)?.percentage}%)`, 'Count']}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Monthly Rating Trend">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getMonthlyTrend()}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                  <XAxis dataKey="month" stroke={isDark ? "#9CA3AF" : "#6B7280"} />
                  <YAxis stroke={isDark ? "#9CA3AF" : "#6B7280"} domain={[1, 5]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      color: isDark ? '#F9FAFB' : '#111827'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="average"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          
        </>
      ) : (
        <FeedbackFormEditor />
      )}
    </div>
  )
}
