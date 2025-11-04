// @/app/main/user/complaints/my/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/mainapp/components'
import { MessageSquareWarning, Calendar } from 'lucide-react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { useTheme } from '@/components/ThemeContext'
import { refreshHeaderAndSidebar } from '@/components/utils/refresh'
import { useComplaints } from '@/lib/hooks/useComplaints'

interface Complaint {
  id: string
  title: string
  category: string
  status: string
  created_at: string
  resolution_message?: string
  media_urls?: string[]
}

export default function MyComplaints() {
  const { isDark } = useTheme()
  const { complaints, isLoading: loading, refreshComplaints } = useComplaints()
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10

  // For pagination, we still need to handle page state
  // But since the hook handles real-time updates, we don't need manual fetching
  useEffect(() => {
    // Update total count for pagination
    setTotal(complaints.length)
  }, [complaints])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const columns = [
    {
      key: 'title' as const,
      header: 'Complaint',
      render: (value: string, row: Complaint) => (
        <div>
          <div className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{value}</div>
          <div className={`text-sm capitalize ${isDark ? 'text-white' : 'text-black'}`}>{row.category}</div>
        </div>
      )
    },
    {
      key: 'media_urls' as const,
      header: 'Media',
      render: (value: string[]) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {value && value.length > 0 ? (
            value.slice(0, 3).map((url, index) => {
              const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
              const isVideo = /\.(mp4|webm|ogg)$/i.test(url)
              return (
                <div key={index} className="relative">
                  {isImage ? (
                    <img
                      src={url}
                      alt={`Media ${index + 1}`}
                      className="w-8 h-8 object-cover rounded border"
                    />
                  ) : isVideo ? (
                    <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center border">
                      <span className="text-white text-xs font-bold">VID</span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gray-500 rounded flex items-center justify-center border">
                      <span className="text-white text-xs">FILE</span>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <span className={`text-xs ${isDark ? 'text-white' : 'text-black'}`}>-</span>
          )}
          {value && value.length > 3 && (
            <span className={`text-xs ${isDark ? 'text-white' : 'text-black'}`}>+{value.length - 3}</span>
          )}
        </div>
      )
    },
    {
      key: 'resolution_message' as const,
      header: 'Admin Resolution',
      render: (value: string) => (
        <div className={`text-sm whitespace-pre-wrap max-w-xs ${isDark ? 'text-white' : 'text-black'}`}>
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
        <div className={`flex items-center text-sm ${isDark ? 'text-white' : 'text-black'}`}>
          <Calendar className={`w-4 h-4 mr-1 ${isDark ? 'text-white' : 'text-black'}`} />
          {new Date(value).toLocaleDateString()}
        </div>
      )
    }
  ]

  const handleRefreshComplaints = async () => {
    await refreshComplaints()
    // Refresh header and sidebar data
    refreshHeaderAndSidebar()
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className={`space-y-6 ${isDark ? 'text-white bg-slate-900' : 'text-black bg-white'}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            My Complaints
          </h1>
          <p className={`mt-1 ${isDark ? 'text-slate-400' : 'text-black'}`}>
            Track the status of your submitted complaints
          </p>
        </div>
        <button
          onClick={handleRefreshComplaints}
          disabled={loading}
          title="Refresh complaints"
          className={`p-2 rounded-md transition-colors ${
            isDark
              ? 'text-white hover:text-slate-200 hover:bg-slate-700'
              : 'text-black hover:text-gray-700 hover:bg-gray-100'
          } ${loading ? 'animate-spin' : ''}`}
        >
          <ArrowPathIcon className={`w-5 h-5 ${isDark ? 'text-white' : 'text-black'}`} />
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

      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setPage(pageNum)}
              disabled={loading || pageNum === page}
              className={`px-3 py-1 rounded-md border ${
                pageNum === page
                  ? `bg-blue-600 ${isDark ? 'text-white' : 'text-white'} border-blue-600`
                  : `${isDark ? 'bg-slate-800 text-white border-slate-600 hover:bg-slate-700' : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-100'}`
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}