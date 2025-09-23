'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { 
  KPIStatCard, 
  ChartCard, 
  DataTable, 
  EmptyState 
} from '@/components/mainapp/components'
import { 
  MessageSquareWarning, 
  PieChart, 
  Smile, 
  TrendingUp,
  Plus,
  Eye,
  Calendar
} from 'lucide-react'

interface UserDashboardData {
  myComplaints: number
  myVotes: number
  myFeedback: number
  satisfactionIndex: number
  recentPolls: any[]
  recentComplaints: any[]
}

export default function UserDashboard() {
  const { data: session } = useSession()
  const [data, setData] = useState<UserDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch dashboard summary
        const response = await fetch('/api/me/summary')
        if (response.ok) {
          const summaryData = await response.json()
          
          // Fetch recent polls
          const pollsResponse = await fetch('/api/polls?limit=5')
          const pollsData = pollsResponse.ok ? await pollsResponse.json() : { polls: [] }
          
          // Fetch my complaints
          const complaintsResponse = await fetch('/api/complaints?my=true&limit=5')
          const complaintsData = complaintsResponse.ok ? await complaintsResponse.json() : { complaints: [] }
          
          setData({
            myComplaints: summaryData.stats.myComplaints || 0,
            myVotes: summaryData.stats.myVotes || 0,
            myFeedback: summaryData.stats.totalFeedback || 0,
            satisfactionIndex: summaryData.stats.satisfactionIndex || 0,
            recentPolls: pollsData.polls.slice(0, 5) || [],
            recentComplaints: complaintsData.complaints.slice(0, 3) || []
          })
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const pollColumns = [
    {
      key: 'title' as const,
      header: 'Poll Title',
      render: (value: string, row: any) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {row.vote_count} votes
          </div>
        </div>
      )
    },
    {
      key: 'deadline' as const,
      header: 'Deadline',
      render: (value: string) => (
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4 mr-1" />
          {value ? new Date(value).toLocaleDateString() : 'No deadline'}
        </div>
      )
    },
    {
      key: 'id' as const,
      header: 'Action',
      render: (value: string) => (
        <Link
          href={`/main/user/polls/${value}`}
          className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <Eye className="w-4 h-4 mr-1" />
          View
        </Link>
      )
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <EmptyState
        title="Unable to load dashboard"
        description="Please try refreshing the page"
        icon={TrendingUp}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back, {session?.user?.name}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIStatCard
          title="My Complaints"
          value={data.myComplaints}
          icon={MessageSquareWarning}
        />
        <KPIStatCard
          title="My Votes"
          value={data.myVotes}
          icon={PieChart}
        />
        <KPIStatCard
          title="Community Rating"
          value={`${data.satisfactionIndex}/5`}
          icon={Smile}
        />
        <KPIStatCard
          title="My Feedback"
          value={data.myFeedback}
          icon={TrendingUp}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/main/user/complaints/submit"
          className="p-6 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 group"
        >
          <MessageSquareWarning className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold mb-2">Submit Complaint</h3>
          <p className="text-red-100 text-sm">Report issues or concerns</p>
        </Link>

        <Link
          href="/main/user/polls"
          className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 group"
        >
          <PieChart className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold mb-2">Vote on Polls</h3>
          <p className="text-blue-100 text-sm">Participate in community decisions</p>
        </Link>

        <Link
          href="/main/user/feedback/submit"
          className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 group"
        >
          <Smile className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold mb-2">Give Feedback</h3>
          <p className="text-green-100 text-sm">Share your thoughts and suggestions</p>
        </Link>
      </div>

      {/* Recent Polls */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Polls
          </h2>
          <Link 
            href="/main/user/polls" 
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View all
          </Link>
        </div>
        
        {data.recentPolls.length > 0 ? (
          <DataTable
            data={data.recentPolls}
            columns={pollColumns}
            emptyMessage="No polls available"
          />
        ) : (
          <EmptyState
            title="No active polls"
            description="Check back later for new community polls"
            icon={PieChart}
          />
        )}
      </div>

      {/* My Recent Complaints */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            My Recent Complaints
          </h2>
          <Link 
            href="/main/user/complaints/my" 
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View all
          </Link>
        </div>
        
        {data.recentComplaints.length > 0 ? (
          <div className="space-y-3">
            {data.recentComplaints.map((complaint: any) => (
              <div key={complaint.id} className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {complaint.title}
                </h3>
                <div className="flex items-center space-x-4 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${complaint.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      complaint.status === 'in-progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                    {complaint.status}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(complaint.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No complaints yet"
            description="Submit your first complaint to get started"
            icon={MessageSquareWarning}
            actionLabel="Submit Complaint"
            actionHref="/main/user/complaints/submit"
          />
        )}
      </div>
    </div>
  )
}