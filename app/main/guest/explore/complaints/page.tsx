
// @/app/main/guest/explore/complaints/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { ChartCard } from '@/components/mainapp/components'
import { MessageSquareWarning, TrendingUp, BarChart3 } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

export default function GuestExploreComplaints() {
  const [stats, setStats] = useState({
    totalComplaints: 89,
    resolvedComplaints: 67,
    averageResolutionTime: '5.2 days'
  })

  const categoryData = [
    { name: 'Maintenance', value: 45, color: '#3B82F6' },
    { name: 'Governance', value: 30, color: '#EF4444' },
    { name: 'Other', value: 14, color: '#10B981' }
  ]

  const monthlyData = [
    { month: 'Jan', submitted: 12, resolved: 8 },
    { month: 'Feb', submitted: 15, resolved: 14 },
    { month: 'Mar', submitted: 18, resolved: 16 },
    { month: 'Apr', submitted: 14, resolved: 15 },
    { month: 'May', submitted: 16, resolved: 14 },
    { month: 'Jun', submitted: 14, resolved: 10 }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Community Feedback</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Public overview of community issues and resolutions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.resolvedComplaints}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-orange-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Resolution</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageResolutionTime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Issues by Category">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props) => {
                  const { name, percent } = props as unknown as { name: string; percent: number }
                  return `${name} ${(percent * 100).toFixed(0)}%`
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Trend">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Bar dataKey="submitted" fill="#3B82F6" name="Submitted" />
              <Bar dataKey="resolved" fill="#10B981" name="Resolved" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}