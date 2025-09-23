
// @/app/main/guest/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { KPIStatCard, ChartCard } from '@/components/mainapp/components'
import { Users, PieChart, MessageSquareWarning, Smile, Eye, LogIn } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { RoleDebug } from '@/components/RoleDebug'



export default function GuestDashboard() {
  const [stats, setStats] = useState({
    totalMembers: 175,
    activePolls: 3,
    resolvedComplaints: 87,
    satisfactionIndex: 4.2
  })
  const [pollData, setPollData] = useState([
    { name: 'Community Garden', votes: 45 },
    { name: 'Security Cameras', votes: 38 },
    { name: 'Playground Upgrade', votes: 52 }
  ])

  return (
    <div className="space-y-6">
      {/* Header */}

<RoleDebug />
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to Our Community
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Explore our vibrant community engagement platform
        </p>
        <div className="flex items-center justify-center space-x-4">
          <Link
            href="/main/guest/access"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Join Community
          </Link>
          <Link
            href="/main/guest/explore/polls"
            className="inline-flex items-center px-6 py-3 border border-slate-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200"
          >
            <Eye className="w-4 h-4 mr-2" />
            Explore
          </Link>
        </div>
      </div>

      {/* Public Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIStatCard
          title="Community Members"
          value={stats.totalMembers}
          icon={Users}
        />
        <KPIStatCard
          title="Active Polls"
          value={stats.activePolls}
          icon={PieChart}
        />
        <KPIStatCard
          title="Issues Resolved"
          value={stats.resolvedComplaints}
          icon={MessageSquareWarning}
        />
        <KPIStatCard
          title="Satisfaction"
          value={`${stats.satisfactionIndex}/5`}
          icon={Smile}
        />
      </div>

      {/* Public Poll Results */}
      <ChartCard title="Recent Poll Results">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={pollData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="name" stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
            <Tooltip />
            <Bar dataKey="votes" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-4">Join Our Community Today</h2>
        <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
          Become a part of our engaged community. Participate in polls, share feedback, 
          and help shape the future of our neighborhood.
        </p>
        <Link
          href="/main/guest/access"
          className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200 font-semibold"
        >
          Get Started
        </Link>
      </div>
    </div>
  )
}
