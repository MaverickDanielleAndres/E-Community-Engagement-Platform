// @/app/main/admin/complaints/page.tsx - Updated with full functionality
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DataTable, EmptyState, SearchInput } from '@/components/mainapp/components'
import { MessageSquareWarning, Eye, Calendar, User, AlertCircle, Trash2, RefreshCw } from 'lucide-react'
import { useTheme } from '@/components/ThemeContext'
import { Toast } from '@/components/Toast'
import { refreshHeaderAndSidebar } from '@/components/utils/refresh'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface Complaint {
  id: string
  title: string
  description: string
  category: 'maintenance' | 'governance' | 'other'
  status: 'pending' | 'in-progress' | 'resolved'
  priority: number
  sentiment: number
  created_at: string
  users: { name: string; email: string }
}

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  })
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [complaintToDelete, setComplaintToDelete] = useState<string | null>(null)
  const { isDark } = useTheme()

  const refreshComplaints = async () => {
    setLoading(true)
    try {
      let url = '/api/complaints?'
      if (filters.status) url += `status=${filters.status}&`
      if (filters.category) url += `category=${filters.category}&`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setComplaints(data.complaints || [])
      } else {
        setToast({ message: 'Failed to refresh complaints', type: 'error' })
      }
    } catch (error) {
      console.error('Failed to refresh complaints:', error)
      setToast({ message: 'Failed to refresh complaints', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        let url = '/api/complaints?'
        if (filters.status) url += `status=${filters.status}&`
        if (filters.category) url += `category=${filters.category}&`

        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setComplaints(data.complaints || [])
        } else {
          setToast({ message: 'Failed to load complaints', type: 'error' })
        }
      } catch (error) {
        console.error('Failed to fetch complaints:', error)
        setToast({ message: 'Failed to load complaints', type: 'error' })
      } finally {
        setLoading(false)
      }
    }

    fetchComplaints()
  }, [filters.status, filters.category])

  // Check for refresh flag from detail page
  useEffect(() => {
    const refreshFlag = localStorage.getItem('complaintsListRefresh')
    if (refreshFlag === 'true') {
      localStorage.removeItem('complaintsListRefresh')
      refreshComplaints()
    }
  }, [])

  // Listen for sidebar refresh flag when new complaints are submitted
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sidebarRefresh' && e.newValue === 'true') {
        localStorage.removeItem('sidebarRefresh')
        refreshComplaints()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
      case 'in-progress':
        return isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
      case 'resolved':
        return isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
      default:
        return isDark ? 'bg-gray-900 text-gray-200' : 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'maintenance':
        return isDark ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-800'
      case 'governance':
        return isDark ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
      case 'other':
        return isDark ? 'bg-gray-900 text-gray-200' : 'bg-gray-100 text-gray-800'
      default:
        return isDark ? 'bg-gray-900 text-gray-200' : 'bg-gray-100 text-gray-800'
    }
  }

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment < -0.3) return { icon: AlertCircle, color: 'text-red-500', label: 'Negative' }
    if (sentiment > 0.3) return { icon: AlertCircle, color: 'text-green-500', label: 'Positive' }
    return { icon: AlertCircle, color: 'text-yellow-500', label: 'Neutral' }
  }

  const openDeleteModal = (complaintId: string) => {
    setComplaintToDelete(complaintId)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteComplaint = async () => {
    if (!complaintToDelete) return

    try {
      const response = await fetch(`/api/complaints/${complaintToDelete}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setComplaints(complaints.filter(c => c.id !== complaintToDelete))
        setToast({ message: 'Complaint deleted successfully', type: 'success' })
        // Trigger sidebar refresh
        localStorage.setItem('sidebarRefresh', 'true')
        setIsDeleteModalOpen(false)
        setComplaintToDelete(null)
      } else {
        setToast({ message: 'Failed to delete complaint', type: 'error' })
      }
    } catch (error) {
      console.error('Failed to delete complaint:', error)
      setToast({ message: 'Failed to delete complaint', type: 'error' })
    }
  }

  const columns = [
    {
      key: 'title' as const,
      header: 'Complaint',
      render: (value: string, row: Complaint) => (
        <div>
          <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</div>
          <div className={`text-sm truncate max-w-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {row.description}
          </div>
        </div>
      )
    },
    {
      key: 'users' as const,
      header: 'Submitted By',
      render: (value: any) => (
        <div className="flex items-center text-sm">
          <User className="w-4 h-4 mr-2 text-gray-400" />
          <div>
            <div className={isDark ? 'text-white' : 'text-gray-900'}>{value?.name}</div>
            <div className={isDark ? 'text-gray-400' : 'text-gray-500'}>{value?.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'category' as const,
      header: 'Category',
      render: (value: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(value)}`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
    {
      key: 'status' as const,
      header: 'Status',
      render: (value: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
          {value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ')}
        </span>
      )
    },
    {
      key: 'sentiment' as const,
      header: 'Sentiment',
      render: (value: number) => {
        const sentiment = getSentimentIcon(value)
        return (
          <div className="flex items-center">
            <sentiment.icon className={`w-4 h-4 mr-1 ${sentiment.color}`} />
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {sentiment.label}
            </span>
          </div>
        )
      }
    },
    {
      key: 'created_at' as const,
      header: 'Created',
      render: (value: string) => (
        <div className={`flex items-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <Calendar className="w-4 h-4 mr-1" />
          {new Date(value).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'id' as const,
      header: 'Actions',
      render: (value: string, row: Complaint) => (
        <div className="flex items-center space-x-2">
          <Link
            href={`/main/admin/complaints/${value}`}
            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            <Eye className="w-4 h-4" />
          </Link>
          {row.status === 'resolved' && (
            <button
              onClick={() => openDeleteModal(value)}
              className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
              title="Delete resolved complaint"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ]

  const filteredComplaints = complaints.filter(complaint =>
    complaint.title.toLowerCase().includes(filters.search.toLowerCase()) ||
    complaint.description.toLowerCase().includes(filters.search.toLowerCase()) ||
    complaint.users.name.toLowerCase().includes(filters.search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Manage Complaints
          </h1>
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
            Review and respond to community complaints
          </p>
        </div>
        <button
          onClick={() => {
            refreshComplaints()
            localStorage.setItem('sidebarRefresh', 'true')
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'sidebarRefresh',
              newValue: 'true'
            }))
          }}
          disabled={loading}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
            loading
              ? 'opacity-50 cursor-not-allowed'
              : `hover:shadow-md ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200'}`
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SearchInput
          placeholder="Search complaints..."
          value={filters.search}
          onChange={(value) => setFilters({ ...filters, search: value })}
        />

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-gray-900'
          }`}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>

        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-gray-900'
          }`}
        >
          <option value="">All Categories</option>
          <option value="maintenance">Maintenance</option>
          <option value="governance">Governance</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-lg ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
          <div className={`text-2xl font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
            {complaints.filter(c => c.status === 'pending').length}
          </div>
          <div className={`text-sm ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>Pending</div>
        </div>

        <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
          <div className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            {complaints.filter(c => c.status === 'in-progress').length}
          </div>
          <div className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>In Progress</div>
        </div>

        <div className={`p-4 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
          <div className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            {complaints.filter(c => c.status === 'resolved').length}
          </div>
          <div className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>Resolved</div>
        </div>

        <div className={`p-4 rounded-lg ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
          <div className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            {complaints.filter(c => c.sentiment < -0.3).length}
          </div>
          <div className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>High Priority</div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl border ${isDark ? 'border-slate-700' : 'border-slate-200'} overflow-hidden`}>
        {filteredComplaints.length === 0 && !loading ? (
          <EmptyState
            title="No complaints found"
            description="No complaints match your current filters"
            icon={MessageSquareWarning}
          />
        ) : (
          <DataTable
            data={filteredComplaints}
            columns={columns}
            loading={loading}
            emptyMessage="No complaints found"
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setComplaintToDelete(null)
        }}
        onConfirm={handleDeleteComplaint}
        title="Delete Complaint"
        description="Are you sure you want to delete this resolved complaint? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  )
}
