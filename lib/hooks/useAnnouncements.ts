import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { useSession } from 'next-auth/react'

interface Announcement {
  id: string
  title: string
  body?: string
  image_url?: string
  created_at: string
  updated_at: string
  created_by: string
  creator: {
    id: string
    name: string
    email: string
  }
}

export function useAnnouncements() {
  const { data: session } = useSession()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const itemsPerPage = 4

  const supabase = getSupabaseClient()

  const fetchAnnouncements = async (page = currentPage, from = dateFrom, to = dateTo) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', itemsPerPage.toString())
      if (from) params.append('dateFrom', from)
      if (to) params.append('dateTo', to)

      const response = await fetch(`/api/user/announcements?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.announcements || [])
        setTotalItems(data.total || 0)
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage))
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [currentPage, dateFrom, dateTo])

  // Real-time subscription for announcements
  useEffect(() => {
    if (!session?.user?.id) return

    const channel = supabase
      .channel('announcements_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements'
        },
        (payload: any) => {
          console.log('Announcement change detected:', payload)
          // Refresh announcements when changes occur
          fetchAnnouncements(currentPage, dateFrom, dateTo)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.user?.id, currentPage, dateFrom, dateTo])

  const refreshAnnouncements = () => {
    fetchAnnouncements(currentPage, dateFrom, dateTo)
  }

  return {
    announcements,
    isLoading,
    totalItems,
    currentPage,
    totalPages,
    dateFrom,
    dateTo,
    setCurrentPage,
    setDateFrom,
    setDateTo,
    refreshAnnouncements
  }
}
