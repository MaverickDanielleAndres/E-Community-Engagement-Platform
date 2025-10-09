'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, User, Calendar, Image as ImageIcon, Upload, X, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { useToast } from '@/components/ToastContext'
import { useTheme } from '@/components/ThemeContext'
import { LoadingSpinner, EmptyState } from '@/components/ui'
import { Toast } from '@/components/Toast'

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

export default function AdminAnnouncementsPage() {
  const { data: session } = useSession()
  const { showToast } = useToast()
  const { isDark } = useTheme()

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    image: null as File | null
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 4

  // Date filter state
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Fetch announcements
  const fetchAnnouncements = async (page = 1, fromDate = '', toDate = '') => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(fromDate && { dateFrom: fromDate }),
        ...(toDate && { dateTo: toDate })
      })

      const response = await fetch(`/api/admin/announcements?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.announcements || [])
        setTotalPages(data.totalPages || 1)
        setTotalItems(data.total || 0)
      } else {
        setToast({ message: 'Failed to fetch announcements', type: 'error' })
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
      setToast({ message: 'Error fetching announcements', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements(currentPage, dateFrom, dateTo)
  }, [currentPage, dateFrom, dateTo])

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // Handle date filter change
  const handleDateFilterChange = () => {
    setCurrentPage(1) // Reset to first page when filters change
    fetchAnnouncements(1, dateFrom, dateTo)
  }

  // Clear date filters
  const clearDateFilters = () => {
    setDateFrom('')
    setDateTo('')
    setCurrentPage(1)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.body.trim()) {
      setToast({ message: 'Title and content are required', type: 'error' })
      return
    }

    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('body', formData.body)
      if (formData.image) {
        formDataToSend.append('image', formData.image)
      }

      const url = editingAnnouncement
        ? `/api/admin/announcements/${editingAnnouncement.id}`
        : '/api/admin/announcements'

      const method = editingAnnouncement ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        body: formDataToSend
      })

      if (response.ok) {
        setToast({
          message: editingAnnouncement ? 'Announcement updated successfully' : 'Announcement created successfully',
          type: 'success'
        })
        fetchAnnouncements(currentPage, dateFrom, dateTo)
        // Close modal after success
        setIsCreateDialogOpen(false)
        setIsEditDialogOpen(false)
        setEditingAnnouncement(null)
        setFormData({ title: '', body: '', image: null })
      } else {
        const error = await response.json()
        setToast({ message: error.error || 'Failed to save announcement', type: 'error' })
      }
    } catch (error) {
      console.error('Error saving announcement:', error)
      setToast({ message: 'Error saving announcement', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit
  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setFormData({
      title: announcement.title,
      body: announcement.body || '',
      image: null
    })
    setIsEditDialogOpen(true)
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return

    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setToast({ message: 'Announcement deleted successfully', type: 'success' })
        fetchAnnouncements(currentPage, dateFrom, dateTo)
      } else {
        setToast({ message: 'Failed to delete announcement', type: 'error' })
      }
    } catch (error) {
      console.error('Error deleting announcement:', error)
      setToast({ message: 'Error deleting announcement', type: 'error' })
    }
  }

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setToast({ message: 'Please select a valid image file', type: 'error' })
        return
      }
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setToast({ message: 'Image size should be less than 5MB', type: 'error' })
        return
      }
      setFormData(prev => ({ ...prev, image: file }))
    }
  }

  const closeModal = () => {
    setIsCreateDialogOpen(false)
    setIsEditDialogOpen(false)
    setEditingAnnouncement(null)
    setFormData({ title: '', body: '', image: null })
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
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <Filter className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h1 className={`text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent`}>
                Manage Announcements
              </h1>
              <p className={`text-lg mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Create and manage community announcements
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Create Announcement
          </motion.button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`mb-6 p-4 rounded-xl border backdrop-blur-sm ${
            isDark
              ? 'bg-slate-800/80 border-slate-700/50'
              : 'bg-white/80 border-slate-200/50'
          }`}
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center text-center">
            <div className="flex-1 md:flex-none md:w-48">
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg transition-colors ${
                  isDark
                    ? 'bg-slate-700/50 border-slate-600 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <div className="flex-1 md:flex-none md:w-48">
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg transition-colors ${
                  isDark
                    ? 'bg-slate-700/50 border-slate-600 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleDateFilterChange}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={clearDateFilters}
                className={`px-4 py-2 border rounded-lg transition-colors ${
                  isDark
                    ? 'border-slate-600 text-slate-300 hover:bg-slate-700/50'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Clear
              </button>
            </div>
          </div>
        </motion.div>

        {/* Announcements List */}
        {announcements.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <EmptyState
              icon={Filter}
              title="No announcements found"
              description="Try adjusting your filters or create a new announcement"
              actionLabel="Create Announcement"
              onAction={() => setIsCreateDialogOpen(true)}
            />
          </motion.div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-6">
            {announcements.map((announcement, index) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`
                  group relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]
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
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
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
                          <span>{new Date(announcement.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEdit(announcement)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark
                            ? 'text-slate-400 hover:text-blue-400 hover:bg-slate-700/50'
                            : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'
                        }`}
                        aria-label="Edit Announcement"
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this announcement?')) {
                            handleDelete(announcement.id)
                          }
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark
                            ? 'text-slate-400 hover:text-red-400 hover:bg-slate-700/50'
                            : 'text-slate-600 hover:text-red-600 hover:bg-slate-100'
                        }`}
                        aria-label="Delete Announcement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex items-center justify-between mt-8"
              >
                <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} announcements
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-colors ${
                      currentPage === 1
                        ? 'text-slate-400 cursor-not-allowed'
                        : isDark
                          ? 'text-slate-300 hover:bg-slate-700/50'
                          : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : isDark
                            ? 'text-slate-300 hover:bg-slate-700/50'
                            : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg transition-colors ${
                      currentPage === totalPages
                        ? 'text-slate-400 cursor-not-allowed'
                        : isDark
                          ? 'text-slate-300 hover:bg-slate-700/50'
                          : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(isCreateDialogOpen || isEditDialogOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border backdrop-blur-xl ${
              isDark
                ? 'bg-slate-800/95 border-slate-700/50 shadow-2xl shadow-slate-900/50'
                : 'bg-white/95 border-slate-200/50 shadow-2xl shadow-slate-200/50'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <Filter className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-slate-700/50 text-slate-400' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl transition-colors ${
                    isDark
                      ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:bg-slate-700'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:bg-blue-50/50'
                  }`}
                  placeholder="Enter announcement title"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Content *
                </label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl transition-colors resize-none ${
                    isDark
                      ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:bg-slate-700'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:bg-blue-50/50'
                  }`}
                  placeholder="Enter announcement content"
                  rows={8}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Image (Optional)
                </label>
                <div className="space-y-3">
                  <div className={`relative border-2 border-dashed rounded-xl p-6 transition-colors ${
                    isDark
                      ? 'border-slate-600 hover:border-slate-500 bg-slate-700/30'
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                  }`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-center">
                      <Upload className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {formData.image ? formData.image.name : 'Click to upload or drag and drop'}
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  </div>
                  {formData.image && (
                    <div className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                      <ImageIcon className="w-5 h-5 text-blue-500" />
                      <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {formData.image.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                        className="ml-auto p-1 rounded hover:bg-red-100 hover:text-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className={`px-6 py-2.5 border border-slate-300 rounded-xl transition-colors ${
                    isDark
                      ? 'border-slate-600 text-slate-300 hover:bg-slate-700/50'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  } disabled:opacity-50`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingAnnouncement ? 'Update' : 'Create'} Announcement
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
