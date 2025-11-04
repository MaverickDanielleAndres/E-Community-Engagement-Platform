'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { getSupabaseClient } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface Complaint {
  id: string
  title: string
  category: string
  status: string
  created_at: string
  resolution_message?: string
  media_urls?: string[]
}

interface UseComplaintsReturn {
  complaints: Complaint[]
  isLoading: boolean
  error: string | null
  refreshComplaints: () => Promise<void>
}

export function useComplaints(): UseComplaintsReturn {
  const { data: session } = useSession()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = getSupabaseClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  const fetchComplaints = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/complaints?my=true')
      if (response.ok) {
        const data = await response.json()
        setComplaints(data.complaints || [])
        setError(null)
      } else {
        setError('Failed to fetch complaints')
      }
    } catch (err) {
      setError('Error fetching complaints')
      console.error('Error fetching complaints:', err)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id])

  const refreshComplaints = useCallback(async () => {
    await fetchComplaints()
  }, [fetchComplaints])

  useEffect(() => {
    fetchComplaints()
  }, [fetchComplaints])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!session?.user?.id) return

    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel('complaints')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaints',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          console.log('Complaint change detected:', payload)
          fetchComplaints()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaint_replies'
        },
        (payload: any) => {
          console.log('Complaint reply change detected:', payload)
          // Check if this reply is for one of our complaints
          if (payload.new?.complaint_id) {
            const hasComplaint = complaints.some(c => c.id === payload.new.complaint_id)
            if (hasComplaint) {
              fetchComplaints()
            }
          }
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
  }, [session?.user?.id, supabase, fetchComplaints, complaints])

  return {
    complaints,
    isLoading,
    error,
    refreshComplaints
  }
}
