'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DataTable, EmptyState, ConfirmDialog } from '@/components/mainapp/components'
import { PlusSquare, Eye, Edit, Trash2, Calendar, Users } from 'lucide-react'

interface Poll {
  id: string
  title: string
  description: string
  deadline: string
  created_at: string
  vote_count: number
  status: 'active' | 'closed' | 'draft'
}

export default function AdminPolls() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; pollId: string; title: string }>({
    isOpen: false,
    pollId: '',
    title: ''
  })

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const response = await fetch('/api/polls')
        if (response.ok) {
          const data = await response.json()
          setPolls(data.polls || [])
        }
      } catch (error) {
        console.error('Failed to fetch polls:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPolls()
  }, [])

  const handleDeletePoll = async () => {
    try {
      const response = await fetch(`/api/polls/${deleteDialog.pollId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPolls(polls.filter(poll => poll.id !== deleteDialog.pollId))
      }
    } catch (error) {
      console.error('Failed to delete poll:', error)
    }

    setDeleteDialog({ isOpen: false, pollId: '', title: '' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'closed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const columns = [
    {
      key: 'title' as const,
      header: 'Title',
      render: (value: string, row: Poll) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
          {row.description && (
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
              {row.description}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status' as const,
      header: 'Status',
      render: (value: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
    {
      key: 'vote_count' as const,
      header: 'Votes',
      render: (value: number) => (
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Users className="w-4 h-4 mr-1" />
          {value}
        </div>
      )
    },
    {
      key: 'deadline' as const,
      header: 'Deadline',
      render: (value: string) => (
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4 mr-1" />
          {value ? new Date(value).toLocaleDateString() : 'No deadline'}
        </div>
      )
    },
    {
      key: 'created_at' as const,
      header: 'Created',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'id' as const,
      header: 'Actions',
      render: (value: string, row: Poll) => (
        <div className="flex items-center space-x-2">
          <Link
            href={`/main/admin/polls/${value}`}
            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setDeleteDialog({ isOpen: true, pollId: value, title: row.title })}
            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Manage Polls
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage community polls
          </p>
        </div>
        <Link
          href="/main/admin/polls/create"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <PlusSquare className="w-4 h-4 mr-2" />
          Create Poll
        </Link>
      </div>

      {/* Polls Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {polls.length === 0 && !loading ? (
          <EmptyState
            title="No polls yet"
            description="Create your first poll to engage with the community"
            icon={PlusSquare}
            actionLabel="Create Poll"
            // actionHref="/main/admin/polls/create"
          />
        ) : (
          <DataTable
            data={polls}
            columns={columns}
            loading={loading}
            emptyMessage="No polls found"
          />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, pollId: '', title: '' })}
        onConfirm={handleDeletePoll}
        title="Delete Poll"
        description={`Are you sure you want to delete "${deleteDialog.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}