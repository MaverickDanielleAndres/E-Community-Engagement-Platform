// @/app/main/user/notifications/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/mainapp/components'
import { Bell, Check, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline'
import { refreshHeaderAndSidebar } from '@/components/utils/refresh'
import { useTheme } from '@/components/ThemeContext'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'success'
  title: string
  body: string
  created_at: string
  is_read: boolean
}

export default function UserNotifications() {
  const { isDark, themeClasses } = useTheme()
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
          <div className={`font-medium ${row.is_read ? themeClasses.text : themeClasses.textPrimary}`}>
            {value}
          </div>
          <div className={`text-sm ${themeClasses.text}`}>
            {row.body}
          </div>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-4 sm:mb-0">
          <h1 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>Notifications</h1>
          <p className={`mt-1 ${isDark ? 'text-white' : 'text-black'}`}>Stay updated with community activity</p>
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
                  <div className={`p-6 rounded-lg shadow-lg max-w-sm w-full ${isDark ? 'bg-black' : 'bg-white'}`}>
                    <h2 className={`text-lg font-semibold mb-4 ${themeClasses.textPrimary}`}>Confirm Clear All</h2>
                    <p className={`mb-6 ${themeClasses.text}`}>Are you sure you want to clear all notifications? This action cannot be undone.</p>
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => setConfirmClearAll(false)}
                        className={`px-4 py-2 rounded ${isDark ? 'bg-gray-600 text-white hover:bg-gray-700' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'}`}
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
            } ${themeClasses.text} ${themeClasses.hover}`}
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-black border-slate-700' : 'bg-white border-slate-200'}`}>
        <DataTable
          data={notifications}
          columns={columns}
          loading={loading}
          emptyMessage="No notifications"
        />
      </div>

      {unreadCount > 0 && (
        <div className={`text-sm ${themeClasses.text}`}>
          {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
