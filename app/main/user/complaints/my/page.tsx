// @/app/main/user/complaints/my/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/mainapp/components'
import { MessageSquareWarning, Calendar } from 'lucide-react'
import { useTheme } from '@/components/ThemeContext'

interface Complaint {
  id: string
  title: string
  category: string
  status: string
  created_at: string
}

export default function MyComplaints() {
  const { isDark } = useTheme()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await fetch('/api/complaints?my=true')
        if (response.ok) {
          const data = await response.json()
          setComplaints(data.complaints || [])
        }
      } catch (error) {
        console.error('Failed to fetch complaints:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchComplaints()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const columns = [
    {
      key: 'title' as const,
      header: 'Complaint',
      render: (value: string, row: Complaint) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{row.category}</div>
        </div>
      )
    },
    {
      key: 'status' as const,
      header: 'Status',
      render: (value: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
          {value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ')}
        </span>
      )
    },
    {
      key: 'created_at' as const,
      header: 'Submitted',
      render: (value: string) => (
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4 mr-1" />
          {new Date(value).toLocaleDateString()}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          My Complaints
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track the status of your submitted complaints
        </p>
      </div>

      <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <DataTable
          data={complaints}
          columns={columns}
          loading={loading}
          emptyMessage="You haven't submitted any complaints yet"
        />
      </div>
    </div>
  )
}