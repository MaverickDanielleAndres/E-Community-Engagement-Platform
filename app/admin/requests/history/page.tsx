// @/app/admin/requests/history/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/ui/DataTable'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Toast } from '@/components/Toast'
import { getSupabaseClient } from '@/lib/supabase'

interface VerificationHistory {
  id: string
  user_id: string
  full_name: string
  email: string
  address: string
  created_at: string
  approved_at: string | null
  status: 'pending' | 'approved' | 'rejected'
}

export default function VerificationHistoryPage() {
  const [history, setHistory] = useState<VerificationHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/admin/verification-requests/history')
        const data = await response.json()
        if (response.ok) {
          setHistory(data.history || [])
        } else {
          setToast({ message: data.message || 'Failed to load history', type: 'error' })
        }
      } catch (error) {
        console.error('Fetch history error:', error)
        setToast({ message: 'Network error', type: 'error' })
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])

  const columns = [
    {
      key: 'full_name' as keyof VerificationHistory,
      header: 'Name',
      render: (value: string) => <div className="font-medium">{value}</div>
    },
    {
      key: 'email' as keyof VerificationHistory,
      header: 'Email',
      render: (value: string) => <div className="text-sm text-gray-600">{value}</div>
    },
    {
      key: 'address' as keyof VerificationHistory,
      header: 'Address',
      render: (value: string) => <div className="text-sm text-gray-600 max-w-xs truncate">{value}</div>
    },
    {
      key: 'created_at' as keyof VerificationHistory,
      header: 'Submitted',
      render: (value: string) => new Date(value).toLocaleString()
    },
    {
      key: 'approved_at' as keyof VerificationHistory,
      header: 'Approved',
      render: (value: string | null) => value ? new Date(value).toLocaleString() : 'N/A'
    },
    {
      key: 'status' as keyof VerificationHistory,
      header: 'Status',
      render: (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
    }
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <h1 className="text-2xl font-bold text-gray-900">Verification Request History</h1>
      <p className="text-gray-600 mb-4">View the history of all verification requests including approval times.</p>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <DataTable
          data={history}
          columns={columns}
          emptyMessage="No verification history found."
        />
      </div>
    </div>
  )
}
