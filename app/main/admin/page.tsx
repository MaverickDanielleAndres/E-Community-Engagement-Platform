
// @/app/main/admin/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Users, PieChart, MessageSquareWarning, Smile, TrendingUp,
  Activity, ArrowUpRight, ArrowDownRight, AlertTriangle,
  CheckCircle, Clock, Calendar, Target, Zap, Bot, 
  Plus, Eye, Bell, UserPlus
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTheme } from '@/components/ThemeContext'
import { Toast } from '@/components/Toast'
import { KPICard } from '@/components/mainapp/components'
import { EmptyState } from '@/components/ui/EmptyState'

interface DashboardStats {
  totalMembers: number
  activePolls: number
  totalPolls: number
  pendingComplaints: number
  totalComplaints: number
  resolvedComplaints: number
  totalFeedback: number
  averageRating: number
  newMembersThisMonth: number
}

interface ActivityItem {
  id: string
  type: 'complaint' | 'poll' | 'feedback' | 'member_joined'
  title: string
  user: string
  timestamp: string
  status?: string
  priority?: 'high' | 'medium' | 'low'
}

interface ChartData {
  name: string
  value: number
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const { isDark } = useTheme()

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/admin/dashboard')

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const data = await response.json()

      setStats(data.stats)
      setRecentActivity(data.recentActivity)
      setChartData(data.memberGrowthData)

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setToast({ message: 'Error loading dashboard data', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const ActivityIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'complaint': return <MessageSquareWarning className={`w-4 h-4 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
      case 'poll': return <PieChart className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
      case 'feedback': return <Smile className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
      case 'member_joined': return <Users className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} />
      default: return <Activity className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
    }
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Welcome back, {session?.user?.name || 'Administrator'}
            </h1>
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              Here's what's happening in your community today
            </p>
          </div>
          <button
            onClick={() => {
              setLoading(true)
              fetchDashboardData()
              // Trigger sidebar refresh
              localStorage.setItem('sidebarRefresh', 'true')
              window.dispatchEvent(new StorageEvent('storage', {
                key: 'sidebarRefresh',
                newValue: 'true'
              }))
            }}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Link href="/main/admin/members">
          <KPICard
            title="Total Members"
            value={stats?.totalMembers || 0}
            change={`+${stats?.newMembersThisMonth || 0} this month`}
            trend="up"
            icon={Users}
            color="blue"
          />
        </Link>
        
        <Link href="/main/admin/polls">
          <KPICard
            title="Active Polls"
            value={stats?.activePolls || 0}
            change="Community voting"
            trend="up"
            icon={PieChart}
            color="green"
          />
        </Link>
        
        <Link href="/main/admin/complaints">
          <KPICard
            title="Open Complaints"
            value={stats?.totalComplaints && stats?.resolvedComplaints 
              ? stats.totalComplaints - stats.resolvedComplaints 
              : 0
            }
            change={`${stats?.pendingComplaints || 0} pending`}
            trend={stats && (stats.totalComplaints - stats.resolvedComplaints) > 5 ? 'down' : 'neutral'}
            icon={MessageSquareWarning}
            color="yellow"
          />
        </Link>
        
        <Link href="/main/admin/feedback">
          <KPICard
            title="Avg Rating"
            value={`${stats?.averageRating || 0}/5`}
            change={`${stats?.totalFeedback || 0} reviews`}
            trend="up"
            icon={Smile}
            color="purple"
          />
        </Link>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`lg:col-span-2 ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Recent Activity
            </h2>
            <Link 
              href="/main/admin/audit-log" 
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`
                  flex items-center space-x-4 p-4 rounded-xl transition-colors duration-200
                  ${isDark ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'}
                `}
              >
                <ActivityIcon type={activity.type} />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {activity.title}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    by {activity.user} • {getTimeAgo(activity.timestamp)}
                  </p>
                </div>
                {activity.priority && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(activity.priority)}`}>
                    {activity.priority}
                  </span>
                )}
                {activity.status && !activity.priority && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                    activity.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  }`}>
                    {activity.status}
                  </span>
                )}
              </motion.div>
            )) : (
              <EmptyState
                title="No recent activity"
                description="Community activity will appear here"
                icon={Activity}
              /
              
              
              >
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}
        >
          <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Quick Actions
          </h2>
          
          <div className="space-y-3">
            <Link
              href="/main/admin/polls/create"
              className={`flex items-center space-x-3 p-4 rounded-xl transition-all duration-200 group ${
                isDark
                  ? 'bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-500 hover:to-slate-700 text-white'
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-black'
              }`}
            >
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Create Poll</span>
            </Link>

            <Link
              href="/main/admin/ai-insights"
              className={`flex items-center space-x-3 p-4 rounded-xl transition-all duration-200 group ${
                isDark
                  ? 'bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-500 hover:to-slate-700 text-white'
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-black'
              }`}
            >
              <Bot className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">AI Insights</span>
            </Link>

            <Link
              href="/main/admin/analytics"
              className={`flex items-center space-x-3 p-4 rounded-xl transition-all duration-200 group ${
                isDark
                  ? 'bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-500 hover:to-slate-700 text-white'
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-black'
              }`}
            >
              <TrendingUp className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">View Analytics</span>
            </Link>

            <Link
              href="/main/admin/members"
              className={`flex items-center space-x-3 p-4 rounded-xl transition-colors duration-200 ${
                isDark
                  ? 'bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-500 hover:to-slate-700 text-white'
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-black'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Manage Members</span>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Member Growth Chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl p-6 shadow-lg border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}
        >
          <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Member Growth
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
              <XAxis 
                dataKey="name" 
                stroke={isDark ? "#9CA3AF" : "#6B7280"} 
                fontSize={12}
              />
              <YAxis stroke={isDark ? "#9CA3AF" : "#6B7280"} fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  color: isDark ? '#F9FAFB' : '#111827',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className={`rounded-2xl p-6 ${
          isDark
            ? 'bg-gradient-to-r from-slate-700 to-slate-900 text-white'
            : 'bg-gradient-to-r from-gray-100 to-gray-200 text-black'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">System Status</h2>
            <p className={`mb-4 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
              All systems operational. Community engagement is {stats?.totalMembers && stats.totalMembers > 10 ? 'strong' : 'growing'} with real-time insights available.
            </p>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                <span className="text-sm">Database</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                <span className="text-sm">API</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                <span className="text-sm">AI Services</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                <span className="text-sm">Notifications</span>
              </div>
            </div>
          </div>
          <div className="hidden sm:block">
            <Target className={`w-16 h-16 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
          </div>
        </div>
      </motion.div>
    </div>
  )
}