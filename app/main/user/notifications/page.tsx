
// @/app/main/user/notifications/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/mainapp/components'
import { Bell, Check, AlertTriangle, Info } from 'lucide-react'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'success'
  title: string
  message: string
  created_at: string
  is_read: boolean
}

export default function UserNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'info',
        title: 'New Poll Available',
        message: 'Community Garden Proposal is now open for voting',
        created_at: new Date().toISOString(),
        is_read: false
      }
    ]
    setNotifications(mockNotifications)
    setLoading(false)
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
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
          <div className={`font-medium ${row.is_read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
            {value}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{row.message}</div>
        </div>
      )
    },
    {
      key: 'created_at' as const,
      header: 'Time',
      render: (value: string) => new Date(value).toLocaleString()
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Stay updated with community activity</p>
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