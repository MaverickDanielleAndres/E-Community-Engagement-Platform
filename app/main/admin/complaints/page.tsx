'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DataTable, EmptyState, SearchInput } from '@/components/mainapp/components'
import { MessageSquareWarning, Eye, Calendar, User, AlertCircle } from 'lucide-react'

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
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  })

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
        }
      } catch (error) {
        console.error('Failed to fetch complaints:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchComplaints()
  }, [filters])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'maintenance':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'governance':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'other':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment < -0.3) return { icon: AlertCircle, color: 'text-red-500', label: 'Negative' }
    if (sentiment > 0.3) return { icon: AlertCircle, color: 'text-green-500', label: 'Positive' }
    return { icon: AlertCircle, color: 'text-yellow-500', label: 'Neutral' }
  }

  const columns = [
    {
      key: 'title' as const,
      header: 'Complaint',
      render: (value: string, row: Complaint) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
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
            <div className="text-gray-900 dark:text-white">{value?.name}</div>
            <div className="text-gray-500 dark:text-gray-400">{value?.email}</div>
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
            <span className="text-sm text-gray-600 dark:text-gray-400">
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
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4 mr-1" />
          {new Date(value).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'id' as const,
      header: 'Actions',
      render: (value: string) => (
        <Link
          href={`/main/admin/complaints/${value}`}
          className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
        >
          <Eye className="w-4 h-4" />
        </Link>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Manage Complaints
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review and respond to community complaints
          </p>
        </div>
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
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        
        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          <option value="maintenance">Maintenance</option>
          <option value="governance">Governance</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {complaints.filter(c => c.status === 'pending').length}
          </div>
          <div className="text-sm text-yellow-700 dark:text-yellow-300">Pending</div>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {complaints.filter(c => c.status === 'in-progress').length}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">In Progress</div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {complaints.filter(c => c.status === 'resolved').length}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">Resolved</div>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {complaints.filter(c => c.sentiment < -0.3).length}
          </div>
          <div className="text-sm text-red-700 dark:text-red-300">High Priority</div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
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
    </div>
  )
}