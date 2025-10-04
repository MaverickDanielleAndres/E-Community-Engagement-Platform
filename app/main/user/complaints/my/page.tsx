// @/app/main/user/complaints/my/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { DataTable, ConfirmDialog } from '@/components/mainapp/components'
import { MessageSquareWarning, Calendar, TrashIcon } from 'lucide-react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { useTheme } from '@/components/ThemeContext'
import { refreshHeaderAndSidebar } from '@/components/utils/refresh'

interface Complaint {
  id: string
  title: string
  category: string
  status: string
  created_at: string
  resolution_message?: string
}

export default function MyComplaints() {
  const { isDark } = useTheme()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null)

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await fetch('/api/complaints?my=true')
        if (response.ok) {
          const data = await response.json()
          setComplaints(data.complaints || [])
        }
      } catch (error) {
        console.error('Failed to fetch complaints:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchComplaints()
  }, [])

  // Listen for sidebar refresh flag to refresh complaints list automatically
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sidebarRefresh' && e.newValue === 'true') {
        localStorage.removeItem('sidebarRefresh')
        const fetchComplaints = async () => {
          try {
            const response = await fetch('/api/complaints?my=true')
            if (response.ok) {
              const data = await response.json()
              setComplaints(data.complaints || [])
            }
          } catch (error) {
            console.error('Failed to fetch complaints:', error)
          }
        }
        fetchComplaints()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const handleDeleteComplaint = async (complaintId: string) => {
    try {
      const response = await fetch(`/api/complaints/${complaintId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setComplaints(complaints.filter(c => c.id !== complaintId))
        setConfirmDelete(null)
        // Trigger sidebar refresh
        localStorage.setItem('sidebarRefresh', 'true')
      } else {
        console.error('Failed to delete complaint')
      }
    } catch (error) {
      console.error('Failed to delete complaint:', error)
    }
  }

  const columns = [
    {
      key: 'title' as const,
      header: 'Complaint',
      render: (value: string, row: Complaint) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{row.category}</div>
        </div>
      )
    },
    {
      key: 'resolution_message' as const,
      header: 'Admin Resolution',
      render: (value: string) => (
        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-w-xs">
          {value || '-'}
        </div>
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
      key: 'created_at' as const,
      header: 'Submitted',
      render: (value: string) => (
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4 mr-1" />
          {new Date(value).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'id' as const,
      header: 'Actions',
      render: (value: string, row: Complaint) => (
        <button
          onClick={() => setConfirmDelete({ id: value, title: row.title })}
          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
          title="Delete complaint"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      )
    }
  ]

  const refreshComplaints = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/complaints?my=true')
      if (response.ok) {
        const data = await response.json()
        setComplaints(data.complaints || [])
      }
    } catch (error) {
      console.error('Failed to fetch complaints:', error)
    } finally {
      setLoading(false)
    }
    // Refresh header and sidebar data
    refreshHeaderAndSidebar()
  }

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmDelete(null)}
          title="Delete Complaint"
          description={`Are you sure you want to delete the complaint "${confirmDelete.title}"? This action cannot be undone.`}
          onConfirm={() => handleDeleteComplaint(confirmDelete.id)}
          variant="danger"
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            My Complaints
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track the status of your submitted complaints
          </p>
        </div>
        <button
          onClick={refreshComplaints}
          disabled={loading}
          title="Refresh complaints"
          className={`p-2 rounded-md transition-colors ${
            isDark
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          } ${loading ? 'animate-spin' : ''}`}
        >
          <ArrowPathIcon className="w-5 h-5" />
        </button>
      </div>

      <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <DataTable
          data={complaints}
          columns={columns}
          loading={loading}
          emptyMessage="You haven't submitted any complaints yet"
        />
      </div>
    </div>
  )
}
