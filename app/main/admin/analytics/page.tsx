'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, Users, MessageSquareWarning, PieChart as PieChartIcon, 
  Activity, Calendar, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
         LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { ChartCard, KPICard, LoadingSpinner } from '@/components/ui'
import { useTheme } from '@/components/ThemeContext'
import { Toast } from '@/components/Toast'

interface AnalyticsData {
  memberGrowth: any[]
  engagementTrend: any[]
  complaintsByCategory: any[]
  sentimentAnalysis: any[]
  participationRates: any[]
  weeklyActivity: any[]
  totalMembers: number
  activeMembers: number
  totalPolls: number
  totalComplaints: number
  averageSentiment: number
  participationRate: number
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const { isDark } = useTheme()

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        // Mock data to match the specified chart requirements
        const mockData: AnalyticsData = {
          memberGrowth: [
            { month: 'May', members: 0 },
            { month: 'Jun', members: 0.5 },
            { month: 'Jul', members: 1 },
            { month: 'Aug', members: 1.5 },
            { month: 'Sep', members: 2 },
            { month: 'Oct', members: 2 }
          ],
          engagementTrend: [
            { date: '2025-05', polls: 0, complaints: 0, feedback: 0 },
            { date: '2025-06', polls: 0.25, complaints: 0.25, feedback: 0.25 },
            { date: '2025-07', polls: 0.5, complaints: 0.5, feedback: 0.5 },
            { date: '2025-08', polls: 0.75, complaints: 0.75, feedback: 0.75 },
            { date: '2025-09', polls: 1, complaints: 1, feedback: 1 },
            { date: '2025-10', polls: 1, complaints: 1, feedback: 1 }
          ],
          complaintsByCategory: [
            { name: 'Other', value: 100 }
          ],
          sentimentAnalysis: [],
          participationRates: [
            { activity: 'Voting', rate: 0 },
            { activity: 'Complaints', rate: 0.5 },
            { activity: 'Feedback', rate: 1 },
            { activity: 'Events', rate: 1.5 }
          ],
          weeklyActivity: [
            { day: 'Sun', active: 0 },
            { day: 'Mon', active: 0.5 },
            { day: 'Tue', active: 1 },
            { day: 'Wed', active: 1.5 },
            { day: 'Thu', active: 2 },
            { day: 'Fri', active: 2.5 },
            { day: 'Sat', active: 3 }
          ],
          totalMembers: 150,
          activeMembers: 120,
          totalPolls: 25,
          totalComplaints: 10,
          averageSentiment: 0.7,
          participationRate: 85.5
        }

        setData(mockData)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
        setToast({ message: 'Failed to load analytics data', type: 'error' })
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [timeRange])

  const COLORS = isDark
    ? ['#60A5FA', '#F87171', '#34D399', '#FBBF24', '#A78BFA', '#22D3EE']
    : ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
          Unable to load analytics
        </h3>
        <p className="text-slate-500 dark:text-slate-400">
          Please try refreshing the page
        </p>
      </div>
    )
  }

  const memberGrowthTrend = data.memberGrowth.length > 1 
    ? data.memberGrowth[data.memberGrowth.length - 1].members > data.memberGrowth[data.memberGrowth.length - 2].members ? 'up' : 'down'
    : 'neutral'

  const sentimentScore = ((data.averageSentiment + 1) / 2 * 100).toFixed(1)
  const sentimentTrend = data.averageSentiment > 0 ? 'up' : data.averageSentiment < 0 ? 'down' : 'neutral'

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

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Community Analytics
          </h1>
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
            Comprehensive insights into community engagement and activity
          </p>
        </div>

        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className={`
            px-4 py-2.5 rounded-xl border transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500
            ${isDark 
              ? 'bg-slate-800 border-slate-600 text-white' 
              : 'bg-white border-slate-300 text-slate-900'
            }
          `}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6"
      >
        <KPICard
          title="Total Members"
          value={data.totalMembers}
          change="+7 this month"
          trend={memberGrowthTrend}
          icon={Users}
          color="blue"
        />
        <KPICard
          title="Active Members"
          value={data.activeMembers}
          change={`${((data.activeMembers / data.totalMembers) * 100).toFixed(1)}% active`}
          trend="up"
          icon={Activity}
          color="green"
        />
        <KPICard
          title="Total Polls"
          value={data.totalPolls}
          change="+3 this month"
          trend="up"
          icon={PieChartIcon}
          color="purple"
        />
        <KPICard
          title="Complaints"
          value={data.totalComplaints}
          change="-5% from last month"
          trend="down"
          icon={MessageSquareWarning}
          color="yellow"
        />
        <KPICard
          title="Sentiment Score"
          value={`${sentimentScore}%`}
          change="+3% positive"
          trend={sentimentTrend}
          icon={TrendingUp}
          color="indigo"
        />
        <KPICard
          title="Participation"
          value={`${data.participationRate.toFixed(1)}%`}
          change="+2.1% this month"
          trend="up"
          icon={Calendar}
          color="red"
        />
      </motion.div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ChartCard title="Member Growth" className={isDark ? "bg-slate-800" : "bg-white"}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.memberGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                <XAxis 
                  dataKey="month" 
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
                <Area
                  type="monotone"
                  dataKey="members"
                  stroke={isDark ? "#60A5FA" : "#3B82F6"}
                  strokeWidth={3}
                  fill="url(#memberGradient)"
                />
                <defs>
                  <linearGradient id="memberGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? "#60A5FA" : "#3B82F6"} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={isDark ? "#60A5FA" : "#3B82F6"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ChartCard title="Engagement Trend" className={isDark ? "bg-slate-800" : "bg-white"}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.engagementTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                <XAxis 
                  dataKey="date" 
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
                <Line type="monotone" dataKey="polls" stroke={isDark ? "#60A5FA" : "#3B82F6"} strokeWidth={3} dot={{ fill: isDark ? "#60A5FA" : "#3B82F6", r: 4 }} />
                <Line type="monotone" dataKey="complaints" stroke={isDark ? "#F87171" : "#EF4444"} strokeWidth={3} dot={{ fill: isDark ? "#F87171" : "#EF4444", r: 4 }} />
                <Line type="monotone" dataKey="feedback" stroke={isDark ? "#34D399" : "#10B981"} strokeWidth={3} dot={{ fill: isDark ? "#34D399" : "#10B981", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <ChartCard title="Complaints by Category" className={isDark ? "bg-slate-800" : "bg-white"}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.complaintsByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => (
                    <text fill={isDark ? '#F9FAFB' : '#111827'} fontSize={12} dy={-4} textAnchor="middle">
                      {`${name} ${(percent * 100).toFixed(0)}%`}
                    </text>
                  )}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.complaintsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    color: isDark ? '#F9FAFB' : '#111827',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <ChartCard title="Participation Rates by Activity" className={isDark ? "bg-slate-800" : "bg-white"}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.participationRates} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                <XAxis type="number" stroke={isDark ? "#9CA3AF" : "#6B7280"} fontSize={12} />
                <YAxis 
                  dataKey="activity" 
                  type="category" 
                  stroke={isDark ? "#9CA3AF" : "#6B7280"} 
                  fontSize={12}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    color: isDark ? '#F9FAFB' : '#111827',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="rate" fill={isDark ? "#A78BFA" : "#8B5CF6"} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>
      </div>

      {/* Weekly Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
          <ChartCard title="Weekly Activity Pattern" className={isDark ? "bg-slate-800" : "bg-white"}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                <XAxis dataKey="day" stroke={isDark ? "#9CA3AF" : "#6B7280"} fontSize={12} />
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
                <Bar dataKey="active" fill={isDark ? "#FBBF24" : "#F59E0B"} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
      </motion.div>
    </div>
  )
}