'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, User, Image as ImageIcon, Megaphone, X, RefreshCw } from 'lucide-react'
import { useTheme } from '@/components/ThemeContext'
import { LoadingSpinner, EmptyState } from '@/components/ui'
import { refreshHeaderAndSidebar } from '@/components/utils/refresh'

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

export default function UserAnnouncementsPage() {
  const { data: session } = useSession()
  const { isDark } = useTheme()

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 4

  // Date filter state
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastAnnouncementCount, setLastAnnouncementCount] = useState(0)

  // Fetch announcements with pagination and date filter
  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      params.append('limit', itemsPerPage.toString())
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)

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
      setLoading(false)
    }
  }

  // Refetch announcements when page or date filter changes
  useEffect(() => {
    fetchAnnouncements()
  }, [currentPage, dateFrom, dateTo])

  // Polling for new announcements every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const params = new URLSearchParams()
        params.append('page', '1')
        params.append('limit', '1') // only need count, so limit 1
        if (dateFrom) params.append('dateFrom', dateFrom)
        if (dateTo) params.append('dateTo', dateTo)

        const response = await fetch(`/api/user/announcements?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          const newCount = data.total || 0
          if (newCount > lastAnnouncementCount) {
            // New announcements detected, refresh announcements and header/sidebar
            await fetchAnnouncements()
            refreshHeaderAndSidebar()
            setLastAnnouncementCount(newCount)
          } else if (lastAnnouncementCount === 0) {
            // Initialize lastAnnouncementCount on first poll
            setLastAnnouncementCount(newCount)
          }
        }
      } catch (error) {
        console.error('Error polling announcements:', error)
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [dateFrom, dateTo, lastAnnouncementCount])

  const openModal = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedAnnouncement(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'} p-4 md:p-6 space-y-6`}>
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          {/* Desktop layout: icon beside text */}
          <div className="hidden md:flex items-center justify-start gap-3 mb-4">
           
            <div className="flex-1">
              <h1 className={`text-3xl md:text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                Community Announcements
              </h1>
              <p className={`text-lg mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Stay updated with the latest community news and updates
              </p>
            </div>
            <button
              onClick={async () => {
                setIsRefreshing(true)
                await fetchAnnouncements()
                setIsRefreshing(false)
              }}
              disabled={isRefreshing}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              } ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Refresh announcements"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Mobile layout: text first, then centered icon below */}
          <div className="md:hidden">
            <div className="mb-4">
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                Community Announcements
              </h1>
              <p className={`text-lg mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Stay updated with the latest community news and updates
              </p>
            </div>
            <div className="flex justify-center">
              <button
              onClick={async () => {
                setIsRefreshing(true)
                await fetchAnnouncements()
                setIsRefreshing(false)
              }}
              disabled={isRefreshing}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              } ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Refresh announcements"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            </div>
          </div>
        </motion.div>

        {/* Filters and Pagination Controls */}
        <div className="max-w-4xl mx-auto mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`p-6 rounded-2xl border backdrop-blur-sm ${
              isDark
                ? 'bg-slate-800/80 border-slate-700/50'
                : 'bg-white/80 border-slate-200/50'
            }`}
          >
            {/* Date Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  From Date
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isDark
                      ? 'bg-slate-700/50 border-slate-600 text-slate-200 focus:border-blue-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                  }`}
                />
              </div>
              <div className="flex-1">
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  To Date
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isDark
                      ? 'bg-slate-700/50 border-slate-600 text-slate-200 focus:border-blue-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                  }`}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setDateFrom('')
                    setDateTo('')
                    setCurrentPage(1)
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isDark
                      ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Pagination Info */}
            <div className={`text-sm mb-4 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Showing {announcements.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} announcements
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    currentPage === 1
                      ? 'opacity-50 cursor-not-allowed'
                      : isDark
                        ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                >
                  Previous
                </button>

                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                  if (pageNum > totalPages) return null
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? isDark
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-600 text-white'
                          : isDark
                            ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300'
                            : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? 'opacity-50 cursor-not-allowed'
                      : isDark
                        ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Announcements List */}
        {announcements.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <EmptyState
              icon={ImageIcon}
              title="No announcements yet"
              description="Check back later for important updates from your community"
            />
          </motion.div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {announcements.map((announcement, index) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => openModal(announcement)}
                className={`
                  group relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer
                  ${isDark
                    ? 'bg-slate-800/80 border-slate-700/50 hover:border-slate-600/70 shadow-slate-900/50'
                    : 'bg-white/80 border-slate-200/50 hover:border-slate-300/70 shadow-slate-200/50'
                  }
                `}
              >
                {/* Gradient overlay for visual appeal */}
                <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300
                  ${isDark ? 'from-blue-500/20 to-purple-500/20' : 'from-blue-500/10 to-purple-500/10'}`} />

                <div className="relative p-6 md:p-8">
                  <div className="mb-6">
                    <h3 className={`text-xl md:text-2xl font-bold mb-3 leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {announcement.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isDark ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                        <User className="w-4 h-4" />
                        <span className="font-medium">{announcement.creator.name}</span>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isDark ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(announcement.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {announcement.image_url && (
                    <div className="mb-6">
                      <div className="relative overflow-hidden rounded-xl">
                        <img
                          src={announcement.image_url}
                          alt={announcement.title}
                          className="w-full h-48 md:h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t opacity-0 group-hover:opacity-20 transition-opacity duration-300
                          ${isDark ? 'from-slate-900/50' : 'from-slate-100/50'}`} />
                      </div>
                    </div>
                  )}

                  <div className={`prose prose-sm md:prose-base max-w-none ${isDark ? 'prose-invert' : ''}`}>
                    <p className={`text-base md:text-lg leading-relaxed whitespace-pre-wrap ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {announcement.body}
                    </p>
                  </div>
                </div>

                {/* Decorative elements */}
                <div className={`absolute top-4 right-4 w-20 h-20 rounded-full opacity-5 ${isDark ? 'bg-blue-400' : 'bg-blue-600'} blur-xl`} />
                <div className={`absolute bottom-4 left-4 w-16 h-16 rounded-full opacity-5 ${isDark ? 'bg-purple-400' : 'bg-purple-600'} blur-xl`} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Announcement Modal */}
      <AnimatePresence>
        {isModalOpen && selectedAnnouncement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            {/* Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 backdrop-blur-md ${
                isDark ? 'bg-slate-900/80' : 'bg-slate-50/80'
              }`}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`relative max-w-4xl w-full max-h-[90vh] overflow-hidden rounded-2xl border backdrop-blur-sm ${
                isDark
                  ? 'bg-slate-800/95 border-slate-700/50 shadow-slate-900/50'
                  : 'bg-white/95 border-slate-200/50 shadow-slate-200/50'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closeModal}
                className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-colors ${
                  isDark
                    ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300'
                    : 'bg-slate-100/50 hover:bg-slate-200/50 text-slate-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Content */}
              <div className="flex flex-col max-h-[90vh]">
                {/* Image Section - Fixed height, no scroll */}
                {selectedAnnouncement.image_url && (
                  <div className="relative w-full h-64 md:h-96 flex-shrink-0">
                    <img
                      src={selectedAnnouncement.image_url}
                      alt={selectedAnnouncement.title}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t opacity-20 ${
                      isDark ? 'from-slate-900/50' : 'from-slate-100/50'
                    }`} />
                  </div>
                )}

                {/* Scrollable Content Section */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6 md:p-8">
                    <div className="mb-6">
                      <h2 className={`text-2xl md:text-3xl font-bold mb-4 leading-tight ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {selectedAnnouncement.title}
                      </h2>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                          isDark ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <User className="w-4 h-4" />
                          <span className="font-medium">{selectedAnnouncement.creator.name}</span>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                          isDark ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(selectedAnnouncement.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={`prose prose-sm md:prose-base max-w-none ${
                      isDark ? 'prose-invert' : ''
                    }`}>
                      <p className={`text-base md:text-lg leading-relaxed whitespace-pre-wrap ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        {selectedAnnouncement.body}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
