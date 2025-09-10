// @/app/mainapp/dashboard/page.tsx
'use client'

import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { 
  ChartBarIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import SignOutButton from '@/components/SignOutButton'

// Mock data - replace with real API calls
const stats = [
  {
    name: 'Active Polls',
    value: '3',
    change: '+2',
    changeType: 'positive',
    icon: ChartBarIcon,
    color: 'blue'
  },
  {
    name: 'Pending Complaints',
    value: '12',
    change: '-4',
    changeType: 'positive',
    icon: ExclamationTriangleIcon,
    color: 'red'
  },
  {
    name: 'Community Members',
    value: '1,247',
    change: '+23',
    changeType: 'positive',
    icon: UserGroupIcon,
    color: 'green'
  },
  {
    name: 'Upcoming Events',
    value: '5',
    change: '+1',
    changeType: 'positive',
    icon: CalendarIcon,
    color: 'purple'
  }
]

const recentActivities = [
  {
    id: 1,
    type: 'poll',
    title: 'New community playground poll',
    description: 'Vote on the new playground equipment',
    time: '2 hours ago',
    status: 'active',
    icon: ChartBarIcon
  },
  {
    id: 2,
    type: 'complaint',
    title: 'Street lighting complaint resolved',
    description: 'Broken street light on Maple Street has been fixed',
    time: '5 hours ago',
    status: 'resolved',
    icon: CheckCircleIcon
  },
  {
    id: 3,
    type: 'event',
    title: 'Community meeting scheduled',
    description: 'Monthly community meeting this Saturday',
    time: '1 day ago',
    status: 'upcoming',
    icon: CalendarIcon
  },
  {
    id: 4,
    type: 'feedback',
    title: 'New feedback received',
    description: 'Positive feedback about recent park improvements',
    time: '2 days ago',
    status: 'new',
    icon: ChatBubbleLeftRightIcon
  }
]

export default function DashboardPage() {
  const { data: session } = useSession()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20'
      case 'resolved': return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20'
      case 'upcoming': return 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20'
      case 'new': return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20'
      default: return 'text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-900/20'
    }
  }

  const getStatColor = (color: string) => {
    switch (color) {
      case 'blue': return 'from-blue-500 to-blue-600'
      case 'red': return 'from-red-500 to-red-600'
      case 'green': return 'from-green-500 to-green-600'
      case 'purple': return 'from-purple-500 to-purple-600'
      default: return 'from-slate-500 to-slate-600'
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8 text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {session?.user?.name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-slate-300 text-lg">
            Here's what's happening in your community today.
          </p>
        </motion.div>
      </div>
      <div>
        <SignOutButton />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {stat.name}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                  {stat.value}
                </p>
                <div className="flex items-center mt-2">
                  <span className={`text-sm font-medium ${stat.changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400 ml-1">
                    vs last month
                  </span>
                </div>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getStatColor(stat.color)} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Recent Activities
            </h2>
            <button className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
              View all
            </button>
          </div>
          
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                    <activity.icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {activity.title}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {activity.time}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            Quick Actions
          </h2>
          
          <div className="space-y-3">
            {[
              { name: 'Submit a Complaint', href: '/mainapp/complaints/new', icon: ExclamationTriangleIcon, color: 'red' },
              { name: 'Create New Poll', href: '/mainapp/polls/new', icon: ChartBarIcon, color: 'blue' },
              { name: 'Give Feedback', href: '/mainapp/feedback/new', icon: ChatBubbleLeftRightIcon, color: 'green' },
              { name: 'View Community', href: '/mainapp/community', icon: UserGroupIcon, color: 'purple' },
            ].map((action, index) => (
              <motion.a
                key={action.name}
                href={action.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200 group"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${getStatColor(action.color)} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {action.name}
                  </p>
                </div>
                <svg className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Community Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Community Engagement
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Your community participation is making a difference!
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
              <UserGroupIcon className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}