'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { getSupabaseClient } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface DashboardStats {
  activePolls: number
  openComplaints: number
  recentFeedback: number
  unreadNotifications: number
  communityMembers: number
}

interface RecentActivity {
  title: string
  type: 'poll' | 'complaint' | 'feedback' | 'notification'
  date: string
}

interface UseDashboardReturn {
  stats: DashboardStats
  recentActivity: RecentActivity[]
  isLoading: boolean
  error: string | null
  refreshDashboard: () => Promise<void>
}

export function useDashboard(): UseDashboardReturn {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    activePolls: 0,
    openComplaints: 0,
    recentFeedback: 0,
    unreadNotifications: 0,
    communityMembers: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = getSupabaseClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  const fetchDashboardData = useCallback(async () => {
    if (!session?.user?.email) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/user/dashboard')
      if (response.ok) {
        const { stats: fetchedStats, recentActivity: fetchedActivity } = await response.json()
        setStats(fetchedStats)
        setRecentActivity(fetchedActivity)
        setError(null)
      } else {
        setError('Failed to fetch dashboard data')
      }
    } catch (err) {
      setError('Error fetching dashboard data')
      console.error('Error fetching dashboard data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.email])

  const refreshDashboard = useCallback(async () => {
    await fetchDashboardData()
  }, [fetchDashboardData])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!session?.user?.id) return

    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel('dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'polls'
        },
        (payload) => {
          console.log('Dashboard poll change detected:', payload)
          fetchDashboardData()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaints',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          console.log('Dashboard complaint change detected:', payload)
          fetchDashboardData()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feedback',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          console.log('Dashboard feedback change detected:', payload)
          fetchDashboardData()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          console.log('Dashboard notification change detected:', payload)
          fetchDashboardData()
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [session?.user?.id, supabase, fetchDashboardData])

  return {
    stats,
    recentActivity,
    isLoading,
    error,
    refreshDashboard
  }
}
