'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Users, MessageSquareWarning, Smile, Bell, Target, Calendar } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { useTheme } from '@/components/ThemeContext'

interface DashboardStats {
  activePolls: number
  openComplaints: number
  recentFeedback: number
  unreadNotifications: number
  communityMembers: number
}

interface RecentActivity {
  title: string
  type: 'poll' | 'complaint' | 'feedback' | 'notification'
  date: string
}

export default function UserDashboard() {
  const { data: session } = useSession()
  const { isDark } = useTheme()
  const [stats, setStats] = useState<DashboardStats>({
    activePolls: 0,
    openComplaints: 0,
    recentFeedback: 0,
    unreadNotifications: 0,
    communityMembers: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!session?.user?.email) return

      try {
        const response = await fetch('/api/user/dashboard')
        if (response.ok) {
          const { stats: fetchedStats, recentActivity: fetchedActivity } = await response.json()
          setStats(fetchedStats)
          setRecentActivity(fetchedActivity)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [session?.user?.email])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {session?.user?.name || session?.user?.email?.split('@')[0] || 'Resident'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's what's happening in your community today
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-center justify-between pb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Polls</h3>
            <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activePolls}</div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Participate in community decisions</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center justify-between pb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Open Complaints</h3>
            <MessageSquareWarning className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.openComplaints}</div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Track your submissions</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-center justify-between pb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Feedback</h3>
            <Smile className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.recentFeedback}</div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your community contributions</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
          <div className="flex items-center justify-between pb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Unread Notifications</h3>
            <Bell className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.unreadNotifications}</div>
          {stats.unreadNotifications > 0 && (
            <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              New updates available
            </span>
          )}
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
          <div className="flex items-center justify-between pb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Community Members</h3>
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.communityMembers}</div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Active in your community</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
            <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded">Last 7 days</span>
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Stay updated with community events</p>
        </div>
        <div className="p-6 space-y-4">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <motion.div
                key={`${activity.title}-${activity.date}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'poll' ? 'bg-blue-500' :
                    activity.type === 'complaint' ? 'bg-red-500' : 'bg-green-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{activity.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{activity.date}</p>
                  </div>
                </div>
                <Calendar className="w-4 h-4 text-gray-400" />
              </motion.div>
            ))
          ) : (
            <EmptyState
              title="No recent activity"
              description="Get started by participating in polls or submitting feedback"
              icon={Calendar}
            />
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-lg transition-shadow cursor-pointer group p-6">
          <Link href="/main/user/polls" className="block">
            <div className="pb-2">
              <h3 className="flex items-center gap-2 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 font-semibold">
                <Target className="w-6 h-6" />
                View Active Polls
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Participate in community polls and share your opinion
            </p>
          </Link>
        </div>

        <div className="border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-lg transition-shadow cursor-pointer group p-6">
          <Link href="/main/user/complaints/submit" className="block">
            <div className="pb-2">
              <h3 className="flex items-center gap-2 text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300 font-semibold">
                <MessageSquareWarning className="w-6 h-6" />
                Submit Complaint
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Report issues and get them resolved by the community team
            </p>
          </Link>
        </div>

        <div className="border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-lg transition-shadow cursor-pointer group p-6">
          <Link href="/main/user/feedback/submit" className="block">
            <div className="pb-2">
              <h3 className="flex items-center gap-2 text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300 font-semibold">
                <Smile className="w-6 h-6" />
                Give Feedback
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Help improve your community experience
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
