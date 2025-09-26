// @/app/main/admin/notifications/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { DataTable, SearchInput } from '@/components/mainapp/components'
import { Bell, Check, X, AlertTriangle, Info } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { useSession } from 'next-auth/react'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  created_at: string
  is_read: boolean
  user_id: string
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()

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