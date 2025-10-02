// @/components/mainapp/components.tsx - Corrected version
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/ThemeContext'
import { EmptyState } from '@/components/ui/EmptyState'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Loader2, AlertTriangle, CheckCircle,
  Search, User, LogOut, Settings, X, ArrowUpRight, ArrowDownRight
} from 'lucide-react'

// Re-export EmptyState for convenience
export { EmptyState }

// Types
interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string
}

interface KPICardProps {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ElementType
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo'
  onClick?: () => void
}

interface DataTableColumn<T> {
  key: keyof T
  header: string
  render?: (value: any, row: T, index: number) => React.ReactNode
  sortable?: boolean
  width?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  loading?: boolean
  emptyMessage?: string
  searchable?: boolean
  filterable?: boolean
  pagination?: boolean
  pageSize?: number
  className?: string
}

interface ChartCardProps {
  title: string
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
  loading?: boolean
}

interface RoleGuardProps {
  allowedRoles: string[]
  userRole?: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

interface SearchInputProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  className?: string
}

// SearchInput Component
export function SearchInput({
  placeholder = "Search...",
  value = "",
  onChange,
  onSearch,
  className = ""
}: SearchInputProps) {
  const [searchValue, setSearchValue] = useState(value)
  const { isDark } = useTheme()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchValue(newValue)
    onChange?.(newValue)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchValue)
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        value={searchValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`
          w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${isDark
            ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
          }
        `}
      />
    </form>
  )
}

// KPICard Component
export function KPICard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color = 'blue',
  onClick
}: KPICardProps) {
  const { isDark } = useTheme()

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600'
  }

  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-slate-600 dark:text-slate-400'
  }

  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : null

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl p-6 shadow-lg border group transition-all duration-300
        ${onClick ? 'cursor-pointer' : ''}
        ${isDark
          ? 'bg-slate-800 border-slate-700 hover:shadow-2xl hover:shadow-blue-500/10'
          : 'bg-white border-slate-200 hover:shadow-2xl hover:shadow-blue-500/10'
        }
      `}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {title}
          </p>
          <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {value}
          </p>
          {change && (
            <div className="flex items-center mt-3">
              {TrendIcon && (
                <TrendIcon className={`w-4 h-4 mr-1 ${trend ? trendColors[trend] : 'text-slate-400'}`} />
              )}
              <span className={`text-sm font-medium ${trend ? trendColors[trend] : 'text-slate-500'}`}>
                {change}
              </span>
            </div>
          )}
        </div>

        {Icon && (
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`p-4 rounded-2xl shadow-lg bg-gradient-to-br ${colorClasses[color]}`}
          >
            <Icon className="w-6 h-6 text-white" />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// DataTable Component
export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading,
  emptyMessage = "No data available",
  searchable = false,
  filterable = false,
  pagination = true,
  pageSize = 10,
  className = ""
}: DataTableProps<T>) {
  const { isDark } = useTheme()
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>{emptyMessage}</p>
      </div>
    )
  }

  // Filter data
  const filteredData = data.filter(row => {
    if (!searchQuery) return true
    return columns.some(column => {
      const value = row[column.key]
      return String(value).toLowerCase().includes(searchQuery.toLowerCase())
    })
  })

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0

    const aValue = a[sortColumn]
    const bValue = b[sortColumn]

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = pagination ? sortedData.slice(startIndex, endIndex) : sortedData

  const handleSort = (column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} ${className}`}>
      {/* Search and Filter Bar */}
      {(searchable || filterable) && (
        <div className={`p-4 border-b ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50/50'}`}>
          <div className="flex items-center space-x-4">
            {searchable && (
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search..."
                className="flex-1"
              />
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`border-b ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-slate-50/50'}`}>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                  className={`
                    px-6 py-4 text-left text-sm font-semibold transition-colors duration-200
                    ${column.sortable !== false ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700' : ''}
                    ${isDark ? 'text-slate-200' : 'text-slate-700'}
                    ${column.width || ''}
                  `}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-200'}`}>
            <AnimatePresence>
              {paginatedData.map((row, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className={`
                    transition-colors duration-200
                    ${isDark
                      ? 'hover:bg-slate-700/50 text-slate-200'
                      : 'hover:bg-slate-50 text-slate-900'
                    }
                  `}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className="px-6 py-4 text-sm"
                    >
                      {column.render
                        ? column.render(row[column.key], row, index)
                        : String(row[column.key] || '')
                      }
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className={`p-4 border-t ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50/50'}`}>
          <div className="flex items-center justify-between">
            <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Showing {startIndex + 1} to {Math.min(endIndex, sortedData.length)} of {sortedData.length} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                  ${currentPage === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : isDark
                      ? 'hover:bg-slate-700 text-slate-300'
                      : 'hover:bg-slate-100 text-slate-700'
                  }
                `}
              >
                Previous
              </button>

              <span className={`px-3 py-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                  ${currentPage === totalPages
                    ? 'opacity-50 cursor-not-allowed'
                    : isDark
                      ? 'hover:bg-slate-700 text-slate-300'
                      : 'hover:bg-slate-100 text-slate-700'
                  }
                `}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ChartCard Component - Fixed version
export function ChartCard({ title, children, className = '', action }: ChartCardProps) {
  const { isDark } = useTheme()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`
        rounded-2xl p-6 shadow-lg border transition-all duration-300 hover:shadow-xl
        ${isDark
          ? 'bg-slate-800 border-slate-700 hover:shadow-blue-500/5'
          : 'bg-white border-slate-200 hover:shadow-blue-500/5'
        }
        ${className}
      `}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </h3>
        {action && <div>{action}</div>}
      </div>
      <div className="w-full">
        {children}
      </div>
    </motion.div>
  )
}

// ConfirmDialog Component
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false
}: ConfirmDialogProps) {
  const { isDark } = useTheme()

  if (!isOpen) return null

  const confirmButtonClass = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-blue-600 hover:bg-blue-700 text-white'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className={`
            relative transform overflow-hidden rounded-2xl text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg p-6
            ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}
          `}
        >
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 p-1 rounded-lg transition-colors duration-200 ${
              isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X className="w-4 h-4" />
          </button>

          <div className={`mx-auto w-12 h-12 flex items-center justify-center rounded-full mb-4 ${
            variant === 'danger' ? 'bg-red-100 dark:bg-red-900/20' : 'bg-blue-100 dark:bg-blue-900/20'
          }`}>
            {variant === 'danger' ? (
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            ) : (
              <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            )}
          </div>

          <div className="text-center mb-6">
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {title}
            </h3>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {description}
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className={`
                flex-1 px-4 py-2 rounded-xl font-medium transition-colors duration-200
                ${isDark
                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2 rounded-xl font-medium transition-colors duration-200 ${confirmButtonClass} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading...
                </div>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export function RoleGuard({ allowedRoles, userRole, fallback, children }: RoleGuardProps) {
  const { data: session, status } = useSession()

  // Show loading state while session is being fetched
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  let effectiveRole: string | undefined;

  if (status !== 'authenticated') {
    // Unauthenticated users treated as 'guest' for guest pages
    effectiveRole = 'guest';
  } else {
    const currentRole = (userRole || session?.user?.role || '').toLowerCase();
    const currentStatus = session?.user?.verification_status;

    // For pending/unverified/rejected users, treat as 'guest' for access control
    // If status is 'approved' or undefined/active, use actual role
    effectiveRole = (['pending', 'unverified', 'rejected'].includes(currentStatus || '')) ? 'guest' : currentRole;
  }

  // Normalize effectiveRole to lowercase
  const normalizedEffectiveRole = effectiveRole?.toLowerCase() || 'guest';

  // Normalize allowedRoles to lowercase for comparison
  const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());

  console.log('RoleGuard Debug:', {
    allowedRoles: normalizedAllowedRoles,
    effectiveRole: normalizedEffectiveRole,
    sessionUser: session?.user,
    status
  });

  if (!normalizedEffectiveRole || !normalizedAllowedRoles.includes(normalizedEffectiveRole)) {
    console.log('RoleGuard: Access denied for effectiveRole', normalizedEffectiveRole, 'allowed:', normalizedAllowedRoles);
    if (fallback) return <>{fallback}</>

    return (
      <EmptyState
        title="Access Restricted"
        description="You don't have permission to view this content."
        icon={Shield}
      />
    )
  }

  console.log('RoleGuard: Access granted for effectiveRole', normalizedEffectiveRole);
  return <>{children}</>
}



