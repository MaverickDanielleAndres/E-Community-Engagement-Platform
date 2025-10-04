// @/app/main/user/notifications/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/mainapp/components'
import { Bell, Check, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline'
import { refreshHeaderAndSidebar } from '@/components/utils/refresh'

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
  const [confirmClearAll, setConfirmClearAll] = useState(false)

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

  const refreshNotifications = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error)
    } finally {
      setLoading(false)
    }
    // Refresh header and sidebar data
    refreshHeaderAndSidebar()
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
        // Trigger sidebar refresh
        localStorage.setItem('sidebarRefresh', Date.now().toString())
        window.dispatchEvent(new CustomEvent('sidebarRefresh'))
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  const clearAllNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?clear=true', {
        method: 'DELETE',
      })
      if (response.ok) {
        setNotifications([])
        setConfirmClearAll(false)
        // Trigger sidebar refresh
        localStorage.setItem('sidebarRefresh', Date.now().toString())
        window.dispatchEvent(new CustomEvent('sidebarRefresh'))
      } else {
        console.error('Failed to clear notifications')
      }
    } catch (error) {
      console.error('Error clearing notifications:', error)
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
        <div className="flex items-center space-x-2">
          {selectedNotifications.length > 0 && (
            <button
              onClick={() => markAsRead(selectedNotifications)}
              className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Check className="w-3 h-3 mr-1.5" />
              Mark as Read ({selectedNotifications.length})
            </button>
          )}
          {notifications.length > 0 && (
            <>
              <button
                onClick={() => setConfirmClearAll(true)}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <TrashIcon className="w-3 h-3 mr-1.5" />
                Clear All
              </button>
              {confirmClearAll && (
                <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm w-full">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Confirm Clear All</h2>
                    <p className="mb-6 text-gray-700 dark:text-gray-300">Are you sure you want to clear all notifications? This action cannot be undone.</p>
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => setConfirmClearAll(false)}
                        className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={clearAllNotifications}
                        className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <button
            onClick={refreshNotifications}
            disabled={loading}
            title="Refresh notifications"
            className={`p-2 rounded-md transition-colors ${
              loading ? 'animate-spin' : ''
            } text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700`}
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
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
