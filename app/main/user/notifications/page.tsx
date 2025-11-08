// @/app/main/user/notifications/page.tsx
'use client'

import { useState } from 'react'
import { DataTable } from '@/components/mainapp/components'
import { Bell, Check, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline'

import { useTheme } from '@/components/ThemeContext'
import { useNotifications } from '@/lib/hooks/useNotifications'

export default function UserNotifications() {
  const { isDark, themeClasses } = useTheme()
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [confirmClearAll, setConfirmClearAll] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    clearAll,
    refreshNotifications
  } = useNotifications()

  const handleRefreshNotifications = async () => {
    setIsRefreshing(true)
    await refreshNotifications()
    setIsRefreshing(false)
  }

  const handleMarkAsRead = async (notificationIds: string[]) => {
    await markAsRead(notificationIds)
    setSelectedNotifications([])
    // Trigger sidebar refresh
    localStorage.setItem('sidebarRefresh', Date.now().toString())
    window.dispatchEvent(new CustomEvent('sidebarRefresh'))
  }

  const handleClearAllNotifications = async () => {
    await clearAll()
    setConfirmClearAll(false)
    // Trigger sidebar refresh
    localStorage.setItem('sidebarRefresh', Date.now().toString())
    window.dispatchEvent(new CustomEvent('sidebarRefresh'))
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
      render: (value: string, row: any) => (
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



  return (
    <div className={`space-y-6 ${isDark ? 'bg-slate-900 text-white' : 'bg-transparent text-black'}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>Notifications</h1>
          <p className={`mt-1 ${isDark ? 'text-white' : 'text-black'}`}>Stay updated with community activity</p>
        </div>
        <button
          onClick={handleRefreshNotifications}
          disabled={isRefreshing}
          title="Refresh notifications"
          className={`p-2 rounded-md transition-colors ml-4 block sm:inline-flex ${
            isRefreshing ? 'animate-spin' : ''
          } ${themeClasses.text} ${themeClasses.hover}`}
        >
          <ArrowPathIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-2 mb-4 sm:mb-0">
          {selectedNotifications.length > 0 && (
            <button
              onClick={() => handleMarkAsRead(selectedNotifications)}
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
                        onClick={() => handleClearAllNotifications()}
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
        </div>
      </div>

      <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-black border-slate-700' : 'bg-white border-slate-200'}`}>
        <DataTable
          data={notifications}
          columns={columns}
          loading={isLoading}
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
