// @/app/main/admin/notifications/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/mainapp/components'
import { Bell, Check, X, AlertTriangle, Info, TrashIcon, RefreshCw, Edit } from 'lucide-react'
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

  // New state for edit modal and form data
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const [pendingAction, setPendingAction] = useState<{
    id: string | null
    action: 'delete' | 'clear_all' | 'mark_read' | null
  }>({ id: null, action: null })

  const confirmAction = (id: string | null, action: 'delete' | 'clear_all' | 'mark_read') => {
    const messages = {
      delete: 'Are you sure you want to delete this notification? This action cannot be undone.',
      clear_all: 'Are you sure you want to clear all notifications? This action cannot be undone.',
      mark_read: 'Mark this notification as read?'
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Confirm Action',
      message: messages[action],
      action: () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false })
        if (action === 'clear_all') {
          handleClearAll()
        } else if (action === 'mark_read' && id) {
          markAsRead(id)
        } else if (action === 'delete' && id) {
          handleDelete(id)
        }
        setPendingAction({ id: null, action: null })
      }
    })
    setPendingAction({ id, action })
  }

  // New function to handle edit button click
  const handleEdit = (notification: Notification) => {
    setEditingNotification(notification)
    setFormData({
      title: notification.title,
      message: notification.message
    })
    setIsEditDialogOpen(true)
  }

  // New function to handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingNotification) return

    if (!formData.title.trim() || !formData.message.trim()) {
      setToast({ message: 'Title and message are required', type: 'error' })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/notifications?id=${editingNotification.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          message: formData.message
        })
      })

      if (response.ok) {
        setToast({ message: 'Notification updated successfully', type: 'success' })
        fetchNotifications()
        setIsEditDialogOpen(false)
        setEditingNotification(null)
        setFormData({ title: '', message: '' })
      } else {
        setToast({ message: 'Failed to update notification', type: 'error' })
      }
    } catch (error) {
      console.error('Update error:', error)
      setToast({ message: 'Network error', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeEditModal = () => {
    setIsEditDialogOpen(false)
    setEditingNotification(null)
    setFormData({ title: '', message: '' })
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
              <Check className={`w-4 h-4 ${isDark ? 'text-white' : ''}`} />
              <span className="sr-only">Mark as read</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row)}
            className="text-green-600 hover:text-green-700 p-2"
          >
            <Edit className={`w-4 h-4 ${isDark ? 'text-white' : ''}`} />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => confirmAction(row.id, 'delete')}
            className="text-red-600 hover:text-red-700 p-2"
          >
            <TrashIcon className={`w-4 h-4 ${isDark ? 'text-white' : ''}`} />
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

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden max-w-full overflow-x-auto bg-slate-900 dark:bg-slate-900" style={{backgroundColor: isDark ? '#0f172a' : '#ffffff'}}>
        <DataTable
          data={notifications}
          columns={columns}
          loading={loading}
          emptyMessage="No notifications"
        />
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.message}
        onConfirm={confirmDialog.action}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        variant={pendingAction.action === 'delete' ? 'danger' : 'default'}
      />

      {/* Edit Modal */}
      {isEditDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeEditModal}
          />
          {/* Modal */}
          <form
            onSubmit={handleEditSubmit}
            className={`relative w-full max-w-lg rounded-2xl border backdrop-blur-xl p-6 z-10 ${
              isDark
                ? 'bg-slate-800/95 border-slate-700/50 shadow-2xl shadow-slate-900/50'
                : 'bg-white/95 border-slate-200/50 shadow-2xl shadow-slate-200/50'
            }`}
          >
            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Edit Notification
            </h2>
            <div className="mb-4">
              <label className={`block mb-1 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-lg ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
                required
              />
            </div>
            <div className="mb-4">
              <label className={`block mb-1 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-lg resize-none ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
                rows={4}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={closeEditModal}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
