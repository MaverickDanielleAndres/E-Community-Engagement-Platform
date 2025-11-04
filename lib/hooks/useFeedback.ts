'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { getSupabaseClient } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface Feedback {
  id: string
  rating?: number
  comment?: string
  form_data?: Record<string, any>
  resolved_details?: string
  created_at: string
  admin_response?: string
  admin_response_at?: string
  admin_response_by?: string
  admin_user?: {
    name: string
  }
}

interface UseFeedbackReturn {
  feedback: Feedback[]
  isLoading: boolean
  error: string | null
  refreshFeedback: () => Promise<void>
}

export function useFeedback(): UseFeedbackReturn {
  const { data: session } = useSession()
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = getSupabaseClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  const fetchFeedback = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/feedback?my=true')
      if (response.ok) {
        const data = await response.json()
        setFeedback(data.feedback || [])
        setError(null)
      } else {
        setError('Failed to fetch feedback')
      }
    } catch (err) {
      setError('Error fetching feedback')
      console.error('Error fetching feedback:', err)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id])

  const refreshFeedback = useCallback(async () => {
    await fetchFeedback()
  }, [fetchFeedback])

  useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!session?.user?.id) return

    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel('feedback')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feedback',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          console.log('Feedback change detected:', payload)
          fetchFeedback()
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
  }, [session?.user?.id, supabase, fetchFeedback])

  return {
    feedback,
    isLoading,
    error,
    refreshFeedback
  }
}
