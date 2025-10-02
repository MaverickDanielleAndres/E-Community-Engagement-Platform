'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Toast } from '@/components/Toast'
import { Button } from '@/components/Button'
import { DataTable } from '@/components/ui/DataTable'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface VerificationRequest {
  id: string
  user_id: string
  full_name: string
  email: string
  address: string
  created_at: string
  actions?: string
}

export default function AdminRequestsPage() {
  const { data: session, update } = useSession()
  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    action: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {}
  })

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/admin/verification-requests')
      const result = await response.json()

      if (response.ok && result.success) {
        setRequests(result.requests)
      } else {
        setToast({ message: result.message || 'Failed to load requests', type: 'error' })
      }
    } catch (error) {
      console.error('Fetch requests error:', error)
      setToast({ message: 'Network error', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'delete') => {
    try {
      const response = await fetch('/api/admin/verification-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setToast({ message: result.message, type: 'success' })
        fetchRequests()
        // Refresh session if approving to update role immediately
        if (action === 'approve' && update) {
          await update()
        }
      } else {
        setToast({ message: result.message || 'Action failed', type: 'error' })
      }
    } catch (error) {
      console.error('Action error:', error)
      setToast({ message: 'Network error', type: 'error' })
    }
  }

  const confirmAction = (id: string, action: 'approve' | 'reject' | 'delete') => {
    const actions = {
      approve: {
        title: 'Approve Request',
        message: 'Are you sure you want to approve this verification request? The user will gain full access to the platform.'
      },
      reject: {
        title: 'Reject Request',
        message: 'Are you sure you want to reject this verification request? The user will need to sign up again.'
      },
      delete: {
        title: 'Delete Request',
        message: 'Are you sure you want to delete this verification request? This action cannot be undone.'
      }
    }

    setConfirmDialog({
      isOpen: true,
      ...actions[action],
      action: async () => {
        await handleAction(id, action)
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const columns = [
    {
      key: 'full_name' as keyof VerificationRequest,
      header: 'Name',
      render: (value: any, row: VerificationRequest) => (
        <div className="font-medium text-slate-900 dark:text-slate-100">
          {row.full_name}
        </div>
      )
    },
    {
      key: 'email' as keyof VerificationRequest,
      header: 'Email',
      render: (value: any, row: VerificationRequest) => (
        <div className="text-slate-600 dark:text-slate-400 text-sm">
          {row.email}
        </div>
      )
    },
    {
      key: 'address' as keyof VerificationRequest,
      header: 'Address',
      render: (value: any, row: VerificationRequest) => (
        <div className="text-slate-600 dark:text-slate-400 max-w-xs truncate text-sm">
          {row.address}
        </div>
      ),
      className: 'hidden md:table-cell'
    },
    {
      key: 'created_at' as keyof VerificationRequest,
      header: 'Submitted',
      render: (value: any, row: VerificationRequest) => (
        <div className="text-slate-500 dark:text-slate-400 text-sm">
          {new Date(row.created_at).toLocaleDateString()}
        </div>
      ),
      className: 'hidden sm:table-cell'
    },
    {
      key: 'actions' as keyof VerificationRequest,
      header: 'Actions',
      render: (value: any, row: VerificationRequest) => (
        <div className="flex items-center gap-1 sm:gap-2">
          <Link href={`/admin/requests/${row.id}`}>
            <Button variant="outline" size="sm" className="p-2">
              <EyeIcon className="w-4 h-4" />
              <span className="sr-only">View</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => confirmAction(row.id, 'approve')}
            className="text-green-600 hover:text-green-700 p-2"
          >
            <CheckIcon className="w-4 h-4" />
            <span className="sr-only">Approve</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => confirmAction(row.id, 'reject')}
            className="text-red-600 hover:text-red-700 p-2"
          >
            <XMarkIcon className="w-4 h-4" />
            <span className="sr-only">Reject</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => confirmAction(row.id, 'delete')}
            className="text-gray-600 hover:text-gray-700 p-2"
          >
            <TrashIcon className="w-4 h-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      )
    }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.message}
        onConfirm={confirmDialog.action}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Verification Requests
          </h1>
      <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
        Review and manage pending ID verification requests
      </p>
    </div>
    <div className="flex items-center gap-2">
      <Button onClick={fetchRequests} variant="outline" className="self-start sm:self-auto">
        <ArrowPathIcon className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">Refresh</span>
      </Button>
      <Link href="/admin/requests/history">
        <Button variant="outline" className="self-start sm:self-auto">
          History
        </Button>
      </Link>
    </div>
  </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <DataTable
          columns={columns}
          data={requests}
          emptyMessage="No pending requests. All verification requests have been processed."
        />
      </motion.div>
    </div>
  )
}
