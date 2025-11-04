'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { getSupabaseClient } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Notification } from '@/types/notification'

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  markAsRead: (notificationIds: string[]) => Promise<void>
  markAllAsRead: () => Promise<void>
  clearAll: () => Promise<void>
  refreshNotifications: () => Promise<void>
}

export function useNotifications(): UseNotificationsReturn {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = getSupabaseClient()
  const channelsRef = useRef<RealtimeChannel[]>([])

  // Cleanup function
  const cleanup = useCallback(() => {
    channelsRef.current.forEach(channel => channel.unsubscribe())
    channelsRef.current = []
  }, [])

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      } else {
        setError('Failed to fetch notifications')
      }
    } catch (err) {
      setError('Error fetching notifications')
      console.error('Error fetching notifications:', err)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id])

  // Set up real-time subscriptions
  const setupRealtimeSubscriptions = useCallback(() => {
    if (!session?.user?.id) return

    cleanup()

    // Notifications subscription
    const notificationsChannel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${session.user.id}`
      }, async (payload) => {
        console.log('Notification change:', payload)
        if (payload.eventType === 'INSERT') {
          // Add new notification
          const newNotification: Notification = {
            id: payload.new.id,
            title: payload.new.title,
            body: payload.new.body,
            type: payload.new.type,
            link_url: payload.new.link_url,
            is_read: payload.new.is_read,
            created_at: payload.new.created_at
          }
          setNotifications(prev => [newNotification, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          // Update existing notification
          setNotifications(prev => prev.map(notification =>
            notification.id === payload.new.id
              ? { ...notification, is_read: payload.new.is_read }
              : notification
          ))
        } else if (payload.eventType === 'DELETE') {
          // Remove notification
          setNotifications(prev => prev.filter(notification => notification.id !== payload.old.id))
        }
      })
      .subscribe()

    channelsRef.current = [notificationsChannel]
  }, [session?.user?.id, supabase, cleanup])

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds })
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notificationIds.includes(notification.id)
              ? { ...notification, is_read: true }
              : notification
          )
        )
      }
    } catch (err) {
      console.error('Error marking notifications as read:', err)
    }
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds)
    }
  }, [notifications, markAsRead])

  // Clear all notifications
  const clearAll = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?clear=true', {
        method: 'DELETE'
      })

      if (response.ok) {
        setNotifications([])
      }
    } catch (err) {
      console.error('Error clearing notifications:', err)
    }
  }, [])

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications()
  }, [fetchNotifications])

  // Initialize
  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications()
    }
  }, [session?.user?.id, fetchNotifications])

  // Set up subscriptions when user is available
  useEffect(() => {
    if (session?.user?.id) {
      setupRealtimeSubscriptions()
    }

    return cleanup
  }, [session?.user?.id, setupRealtimeSubscriptions, cleanup])

  const unreadCount = notifications.filter(n => !n.is_read).length

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    clearAll,
    refreshNotifications
  }
}
