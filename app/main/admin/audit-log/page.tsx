// @/app/main/admin/audit-log/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { DataTable, SearchInput } from '@/components/mainapp/components'
import { ScrollText, User, Calendar, Filter } from 'lucide-react'

interface AuditEntry {
  id: string
  action_type: string
  entity_type: string
  entity_id: string
  user_name: string
  details: any
  created_at: string
  ip_address?: string
}

export default function AdminAuditLog() {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const mockAuditLog: AuditEntry[] = [
      {
        id: '1',
        action_type: 'create_poll',
        entity_type: 'poll',
        entity_id: 'poll-123',
        user_name: 'Admin User',
        details: { title: 'Community Garden Proposal' },
        created_at: new Date().toISOString(),
        ip_address: '192.168.1.1'
      },
      {
        id: '2',
        action_type: 'update_complaint',
        entity_type: 'complaint',
        entity_id: 'complaint-456',
        user_name: 'Admin User',
        details: { status: 'resolved' },
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        ip_address: '192.168.1.1'
      }
    ]
    setAuditLog(mockAuditLog)
    setLoading(false)
  }, [])

  const columns = [
    {
      key: 'action_type' as const,
      header: 'Action',
      render: (value: string) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {value.replace('_', ' ').toUpperCase()}
        </span>
      )
    },
    {
      key: 'entity_type' as const,
      header: 'Entity',
      render: (value: string, row: AuditEntry) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{row.entity_id}</div>
        </div>
      )
    },
    {
      key: 'user_name' as const,
      header: 'User',
      render: (value: string) => (
        <div className="flex items-center">
          <User className="w-4 h-4 mr-2 text-gray-400" />
          <span className="text-sm text-gray-900 dark:text-white">{value}</span>
        </div>
      )
    },
    {
      key: 'created_at' as const,
      header: 'Timestamp',
      render: (value: string) => (
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4 mr-1" />
          {new Date(value).toLocaleString()}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Audit Log
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track all administrative actions and changes
        </p>
      </div>

      <div className="flex items-center space-x-4">
        <SearchInput
          placeholder="Search audit log..."
          value={filter}
          onChange={setFilter}
          className="max-w-md"
        />
        <select className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700">
          <option>All Actions</option>
          <option>create_poll</option>
          <option>update_complaint</option>
          <option>delete_user</option>
        </select>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <DataTable
          data={auditLog}
          columns={columns}
          loading={loading}
          emptyMessage="No audit entries found"
        />
      </div>
    </div>
  )
}