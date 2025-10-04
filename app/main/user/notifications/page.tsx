// @/app/main/user/notifications/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/mainapp/components'
import { Bell, Check, AlertTriangle, Info, CheckCircle } from 'lucide-react'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'success'
  title: string
  body: string
  created_at: string
  is_read: boolean
}

export default function UserNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notificationIds.includes(notification.id)
              ? { ...notification, is_read: true }
              : notification
          )
        )
        setSelectedNotifications([])
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
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
          <div className="text-sm text-gray-500 dark:text-gray-400">{row.body}</div>
        </div>
      )
    },
    {
      key: 'created_at' as const,
      header: 'Time',
      render: (value: string) => new Date(value).toLocaleString()
    }
  ]

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Stay updated with community activity</p>
        </div>
        {selectedNotifications.length > 0 && (
          <button
            onClick={() => markAsRead(selectedNotifications)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Check className="w-4 h-4 mr-2" />
            Mark as Read ({selectedNotifications.length})
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <DataTable
          data={notifications}
          columns={columns}
          loading={loading}
          emptyMessage="No notifications"
        />
      </div>

      {unreadCount > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
