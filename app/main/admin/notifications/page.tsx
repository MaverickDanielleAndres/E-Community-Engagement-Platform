// @/app/main/admin/notifications/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { DataTable, SearchInput } from '@/components/mainapp/components'
import { Bell, Check, X, AlertTriangle, Info } from 'lucide-react'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  created_at: string
  is_read: boolean
  user: string
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'warning',
        title: 'High Complaint Volume',
        message: 'Unusual spike in complaints detected in the past hour',
        created_at: new Date().toISOString(),
        is_read: false,
        user: 'System'
      },
      {
        id: '2',
        type: 'info',
        title: 'New Poll Created',
        message: 'Community Garden Proposal poll has been created',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        is_read: true,
        user: 'Admin'
      }
    ]
    setNotifications(mockNotifications)
    setLoading(false)
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'error': return <X className="w-4 h-4 text-red-500" />
      case 'success': return <Check className="w-4 h-4 text-green-500" />
      default: return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  const columns = [
    {
      key: 'type' as const,
      header: 'Type',
      render: (value: string) => getTypeIcon(value)
    },
    {
      key: 'title' as const,
      header: 'Notification',
      render: (value: string, row: Notification) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500">{row.message}</div>
        </div>
      )
    },
    {
      key: 'created_at' as const,
      header: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'is_read' as const,
      header: 'Status',
      render: (value: boolean) => value ? 'Read' : 'Unread'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Notifications
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          System alerts and community updates
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <DataTable
          data={notifications}
          columns={columns}
          loading={loading}
          emptyMessage="No notifications"
        />
      </div>
    </div>
  )
}