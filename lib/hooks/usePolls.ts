'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface Poll {
  id: string
  title: string
  description: string
  deadline: string
  created_at: string
  vote_count: number
  status: 'active' | 'closed' | 'draft'
  user_voted: boolean
}

interface UsePollsReturn {
  polls: Poll[]
  isLoading: boolean
  error: string | null
  refreshPolls: () => Promise<void>
}

export function usePolls(): UsePollsReturn {
  const [polls, setPolls] = useState<Poll[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = getSupabaseClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  const fetchPolls = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/polls')
      if (response.ok) {
        const data = await response.json()
        setPolls(data.polls || [])
        setError(null)
      } else {
        setError('Failed to fetch polls')
      }
    } catch (err) {
      setError('Error fetching polls')
      console.error('Error fetching polls:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshPolls = useCallback(async () => {
    await fetchPolls()
  }, [fetchPolls])

  useEffect(() => {
    fetchPolls()
  }, [fetchPolls])

  // Set up real-time subscriptions
  useEffect(() => {
    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel('polls')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'polls'
        },
        (payload) => {
          console.log('Poll change detected:', payload)
          fetchPolls()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'poll_responses'
        },
        (payload) => {
          console.log('Poll vote change detected:', payload)
          fetchPolls()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `type=eq.poll_created`
        },
        (payload) => {
          console.log('Poll notification change detected:', payload)
          fetchPolls()
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
  }, [supabase, fetchPolls])

  return {
    polls,
    isLoading,
    error,
    refreshPolls
  }
}
