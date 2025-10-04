'use client'

import { useState, useEffect } from 'react'
import { DataTable, SearchInput } from '@/components/mainapp/components'
import { User, Calendar, Trash, RefreshCw } from 'lucide-react'
import { useTheme } from '@/components/ThemeContext'

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
  const { isDark } = useTheme()

  useEffect(() => {
    fetchAuditLog()
  }, [])

  const fetchAuditLog = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/audit-log')
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs')
      }
      const data = await response.json()
      setAuditLog(data.logs || [])
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteAllLogs = async () => {
    if (!confirm('Are you sure you want to delete all audit logs?')) return
    try {
      const response = await fetch('/api/admin/audit-log', {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error('Failed to delete all logs')
      }
      await fetchAuditLog()
    } catch (error) {
      console.error('Failed to delete all logs:', error)
    }
  }

  const filteredLogs = auditLog.filter(log =>
    (log.user_name || '').toLowerCase().includes(filter.toLowerCase()) ||
    (log.action_type || '').toLowerCase().includes(filter.toLowerCase()) ||
    (typeof log.details === 'string' ? log.details.toLowerCase() : JSON.stringify(log.details).toLowerCase()).includes(filter.toLowerCase())
  )

  const columns = [
    {
      key: 'created_at' as const,
      header: 'Timestamp',
      render: (value: string) => (
        <div className="flex items-center text-sm text-gray-600 dark:text-white">
          <Calendar className="w-4 h-4 mr-1" />
          {new Date(value).toLocaleString()}
        </div>
      )
    },
    {
      key: 'user_name' as const,
      header: 'User',
      render: (value: string) => (
        <div className="flex items-center text-sm">
          <User className={`w-4 h-4 mr-2 ${isDark ? 'text-white' : 'text-black'}`} />
          <span className={`text-sm ${isDark ? 'text-white' : 'text-black'}`}>{value}</span>
        </div>
      )
    },
    {
      key: 'action_type' as const,
      header: 'Action',
      render: (value: string) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {value.replace(/_/g, ' ').toUpperCase()}
        </span>
      )
    },
    {
      key: 'entity_type' as const,
      header: 'Entity',
      render: (value: string, row: AuditEntry) => (
        <div>
          <div className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{value}</div>
          <div className={`text-sm ${isDark ? 'text-white' : 'text-black'}`}>{row.entity_id}</div>
        </div>
      )
    },
    {
      key: 'details' as const,
      header: 'Details',
      render: (value: any) => (
        <div className="text-sm">{typeof value === 'string' ? value : JSON.stringify(value)}</div>
      )
    },
    {
      key: 'ip_address' as const,
      header: 'IP Address',
      render: (value: string) => (
        <div className="text-sm">{value}</div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Audit Log</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAuditLog}
            disabled={loading}
            className={`
              p-2.5 rounded-xl border transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isDark
                ? 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }
            `}
            title="Refresh audit log data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            onClick={deleteAllLogs}
          >
            <Trash className="w-5 h-5" />
            <span>Delete All</span>
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <SearchInput
          placeholder="Search audit log..."
          value={filter}
          onChange={setFilter}
          className="max-w-md"
        />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <DataTable
          data={filteredLogs}
          columns={columns}
          loading={loading}
          emptyMessage="No audit entries found"
        />
      </div>
    </div>
  )
}
