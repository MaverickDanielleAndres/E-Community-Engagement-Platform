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

  useEffect(() => {
    if (!session?.user?.email) return

    const supabase = getSupabaseClient()

    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/admin/notifications')
        const data = await response.json()
        setNotifications(data.notifications || [])
        setLoading(false)
      } catch (error) {
        console.error('Error fetching notifications:', error)
        setLoading(false)
      }
    }

    fetchNotifications()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        fetchNotifications() // Refetch on any change
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
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
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500">{row.message}</div>
        </div>
      )
    },
    {
      key: 'created_at' as keyof Notification,
      header: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'is_read' as keyof Notification,
      header: 'Status',
      render: (value: boolean) => value ? 'Read' : 'Unread'
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            System alerts and community updates
          </p>
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => confirmAction(null, 'clear_all')}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
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
    </div>
  )
}
