// @/app/main/admin/notifications/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/mainapp/components'
import { Bell, Check, X, AlertTriangle, Info, TrashIcon, RefreshCw } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Toast } from '@/components/Toast'
import { useTheme } from '@/components/ThemeContext'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  created_at: string
  is_read: boolean
  user_id: string
  actions?: string
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null)
  const { isDark } = useTheme()
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    action: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {}
  })

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/notifications')
      const data = await response.json()
      setNotifications(data.notifications || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!session?.user?.email) return

    const supabase = getSupabaseClient()

    const setupRealtimeSubscription = async () => {
      try {
        // For admin users, subscribe to all notifications since they need to see everything
        console.log('Setting up real-time subscription for all notifications (admin view)')

        const channel = supabase
          .channel('admin_notifications_all')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
            console.log('Real-time notification change detected:', payload)
            fetchNotifications()
          })
          .subscribe()

        return channel
      } catch (error) {
        console.error('Error setting up real-time subscription:', error)
        // Fallback subscription if setup fails
        const channel = supabase
          .channel('admin_notifications_fallback')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
            fetchNotifications()
          })
          .subscribe()
        return channel
      }
    }

    fetchNotifications()
    setupRealtimeSubscription().then(channel => {
      return () => {
        if (channel) channel.unsubscribe()
      }
    })

    return () => {
      supabase.channel('admin_notifications_all').unsubscribe()
      supabase.channel('admin_notifications_fallback').unsubscribe()
    }
  }, [session?.user?.email])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'error': return <X className="w-4 h-4 text-red-500" />
      case 'success': return <Check className="w-4 h-4 text-green-500" />
      default: return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/notifications?id=${id}`, {
        method: 'PUT'
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
        )
        setToast({ message: 'Notification marked as read', type: 'success' })
        // Trigger sidebar refresh
        localStorage.setItem('sidebarRefresh', 'true')
      } else {
        setToast({ message: 'Failed to mark notification as read', type: 'error' })
      }
    } catch (error) {
      console.error('Mark as read error:', error)
      setToast({ message: 'Network error', type: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/notifications?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setToast({ message: 'Notification deleted successfully', type: 'success' })
        setNotifications(prev => prev.filter(n => n.id !== id))
        // Trigger sidebar refresh
        localStorage.setItem('sidebarRefresh', 'true')
      } else {
        setToast({ message: 'Failed to delete notification', type: 'error' })
      }
    } catch (error) {
      console.error('Delete error:', error)
      setToast({ message: 'Network error', type: 'error' })
    }
  }

  const handleClearAll = async () => {
    try {
      const response = await fetch('/api/admin/notifications?clear=true', {
        method: 'DELETE'
      })

      if (response.ok) {
        setToast({ message: 'All notifications cleared successfully', type: 'success' })
        setNotifications([])
        // Trigger sidebar refresh
        localStorage.setItem('sidebarRefresh', 'true')
      } else {
        setToast({ message: 'Failed to clear notifications', type: 'error' })
      }
    } catch (error) {
      console.error('Clear error:', error)
      setToast({ message: 'Network error', type: 'error' })
    }
  }

  const confirmAction = (id: string | null, action: 'delete' | 'clear_all' | 'mark_read') => {
    const actions = {
      delete: {
        title: 'Delete Notification',
        message: 'Are you sure you want to delete this notification? This action cannot be undone.'
      },
      clear_all: {
        title: 'Clear All Notifications',
        message: 'Are you sure you want to clear all notifications? This action cannot be undone.'
      },
      mark_read: {
        title: 'Mark Notification as Read',
        message: 'Mark this notification as read?'
      }
    }

    setConfirmDialog({
      isOpen: true,
      title: actions[action].title,
      message: actions[action].message,
      action: () => {
        if (action === 'clear_all') {
          handleClearAll()
        } else if (action === 'mark_read' && id) {
          markAsRead(id)
        } else if (action === 'delete' && id) {
          handleDelete(id)
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false })
      }
    })
  }

  const columns = [
    {
      key: 'type' as keyof Notification,
      header: 'Type',
      render: (value: string) => getTypeIcon(value)
    },
    {
      key: 'title' as keyof Notification,
      header: 'Notification',
      render: (value: string, row: Notification) => (
        <div>
          <div className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{value}</div>
          <div className={`text-sm ${isDark ? 'text-white' : 'text-black'}`}>{row.message}</div>
        </div>
      )
    },
    {
      key: 'created_at' as keyof Notification,
      header: 'Date',
      render: (value: string) => (
        <span className={`${isDark ? 'text-white' : 'text-black'}`}>
          {new Date(value).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'is_read' as keyof Notification,
      header: 'Status',
      render: (value: boolean) => (
        <span className={`${isDark ? 'text-white' : 'text-black'}`}>
          {value ? 'Read' : 'Unread'}
        </span>
      )
    },
    {
      key: 'actions' as keyof Notification,
      header: 'Actions',
      render: (value: any, row: Notification) => (
        <div className="flex items-center gap-2">
          {!row.is_read && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => confirmAction(row.id, 'mark_read')}
              className="text-blue-600 hover:text-blue-700 p-2"
            >
              <Check className="w-4 h-4" />
              <span className="sr-only">Mark as read</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => confirmAction(row.id, 'delete')}
            className="text-red-600 hover:text-red-700 p-2"
          >
            <TrashIcon className="w-4 h-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.message}
        onConfirm={confirmDialog.action}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold text-gray-900 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Notifications
          </h1>
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
            System alerts and community updates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className={`p-2.5 rounded-xl border transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isDark
                ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }
            `}
            title="Refresh notifications"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {notifications.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => confirmAction(null, 'clear_all')}
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
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
