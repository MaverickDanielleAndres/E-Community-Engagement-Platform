'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Users, MessageSquareWarning, Smile, Bell, Target, Calendar } from 'lucide-react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { EmptyState } from '@/components/ui/EmptyState'
import { KPICard } from '@/components/mainapp/components'
import { useTheme } from '@/components/ThemeContext'
import { refreshHeaderAndSidebar } from '@/components/utils/refresh'

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

  const refreshDashboard = async () => {
    setLoading(true)
    try {
      if (!session?.user?.email) return
      const response = await fetch('/api/user/dashboard')
      if (response.ok) {
        const { stats: fetchedStats, recentActivity: fetchedActivity } = await response.json()
        setStats(fetchedStats)
        setRecentActivity(fetchedActivity)
      }
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error)
    } finally {
      setLoading(false)
    }
    // Refresh header and sidebar data
    refreshHeaderAndSidebar()
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Welcome back, {session?.user?.name || session?.user?.email?.split('@')[0] || 'Resident'}
          </h1>
          <button
            onClick={refreshDashboard}
            disabled={loading}
            title="Refresh dashboard"
            className={`p-2 rounded-md transition-colors ${
              isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            } ${loading ? 'animate-spin' : ''}`}
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
        <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>
          Here's what's happening in your community today
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
      >
        <Link href="/main/user/polls">
          <KPICard
            title="Active Polls"
            value={stats.activePolls}
            change="Participate in decisions"
            trend="up"
            icon={Target}
            color="blue"
          />
        </Link>

        <Link href="/main/user/complaints/my">
          <KPICard
            title="Open Complaints"
            value={stats.openComplaints}
            change="Track your submissions"
            trend={stats.openComplaints > 0 ? "down" : "neutral"}
            icon={MessageSquareWarning}
            color="red"
          />
        </Link>

        <Link href="/main/user/feedback/my">
          <KPICard
            title="Recent Feedback"
            value={stats.recentFeedback}
            change="Your contributions"
            trend="up"
            icon={Smile}
            color="green"
          />
        </Link>

        <Link href="/main/user/notifications">
          <KPICard
            title="Unread Notifications"
            value={stats.unreadNotifications}
            change={stats.unreadNotifications > 0 ? "New updates available" : "All caught up"}
            trend={stats.unreadNotifications > 0 ? "up" : "neutral"}
            icon={Bell}
            color="purple"
          />
        </Link>

        <KPICard
          title="Community Members"
          value={stats.communityMembers}
          change="Active in community"
          trend="up"
          icon={Users}
          color="indigo"
        />
      </motion.div>

      {/* Recent Activity */}
      <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-lg border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <div className={`p-6 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <h3 className={`flex items-center gap-2 text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Recent Activity
            <span className={`px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded`}>Last 7 days</span>
          </h3>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Stay updated with community events</p>
        </div>
        <div className="p-6 space-y-4">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <motion.div
                key={`${activity.title}-${activity.date}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  isDark ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'poll' ? 'bg-blue-500' :
                    activity.type === 'complaint' ? 'bg-red-500' : 'bg-green-500'
                  }`}></div>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{activity.title}</p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{activity.date}</p>
                  </div>
                </div>
                <Calendar className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-gray-400'}`} />
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
        <div className={`border rounded-lg hover:shadow-lg transition-shadow cursor-pointer group p-6 ${
          isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
        }`}>
          <Link href="/main/user/polls" className="block">
            <div className="pb-2">
              <h3 className={`flex items-center gap-2 font-semibold ${
                isDark ? 'text-blue-400 group-hover:text-blue-300' : 'text-blue-600 group-hover:text-blue-700'
              }`}>
                <Target className="w-6 h-6" />
                View Active Polls
              </h3>
            </div>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              Participate in community polls and share your opinion
            </p>
          </Link>
        </div>

        <div className={`border rounded-lg hover:shadow-lg transition-shadow cursor-pointer group p-6 ${
          isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
        }`}>
          <Link href="/main/user/complaints/submit" className="block">
            <div className="pb-2">
              <h3 className={`flex items-center gap-2 font-semibold ${
                isDark ? 'text-red-400 group-hover:text-red-300' : 'text-red-600 group-hover:text-red-700'
              }`}>
                <MessageSquareWarning className="w-6 h-6" />
                Submit Complaint
              </h3>
            </div>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              Report issues and get them resolved by the community team
            </p>
          </Link>
        </div>

        <div className={`border rounded-lg hover:shadow-lg transition-shadow cursor-pointer group p-6 ${
          isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
        }`}>
          <Link href="/main/user/feedback/submit" className="block">
            <div className="pb-2">
              <h3 className={`flex items-center gap-2 font-semibold ${
                isDark ? 'text-green-400 group-hover:text-green-300' : 'text-green-600 group-hover:text-green-700'
              }`}>
                <Smile className="w-6 h-6" />
                Give Feedback
              </h3>
            </div>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              Help improve your community experience
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
