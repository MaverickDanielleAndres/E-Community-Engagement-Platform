// @/components/ui/DataTable.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp, ChevronDown, Search, Filter } from 'lucide-react'
import { useTheme } from '@/components/ThemeContext'

interface DataTableColumn<T> {
  key: keyof T
  header: string
  render?: (value: any, row: T, index: number) => React.ReactNode
  sortable?: boolean
  width?: string
}

interface DataTableProps<T extends Record<string, any>> {
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

export function DataTable<T extends Record<string, any>>({ 
  data, 
  columns, 
  loading = false,
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

  // Filter and sort data
  const filteredData = data.filter(row => {
    if (!searchQuery) return true
    return columns.some(column => {
      const value = row[column.key]
      return String(value).toLowerCase().includes(searchQuery.toLowerCase())
    })
  })

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0
    
    const aValue = a[sortColumn]
    const bValue = b[sortColumn]
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Pagination
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

  if (loading) {
    return (
      <div className={`rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} p-12`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={`rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} p-8`}>
        <div className="text-center py-12">
          <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} ${className}`}>
      {/* Search and Filter Bar */}
      {(searchable || filterable) && (
        <div className={`p-4 border-b ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50/50'}`}>
          <div className="flex items-center space-x-4">
            {searchable && (
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className={`
                    w-full pl-10 pr-4 py-2 rounded-xl border transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    ${isDark 
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
                    }
                  `}
                />
              </div>
            )}
            {filterable && (
              <button className={`
                p-2 rounded-xl transition-colors duration-200
                ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}
              `}>
                <Filter className="w-4 h-4" />
              </button>
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
                  <div className="flex items-center space-x-2">
                    <span>{column.header}</span>
                    {column.sortable !== false && sortColumn === column.key && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {sortDirection === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </motion.div>
                    )}
                  </div>
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
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  )
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className={`px-2 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          ...
                        </span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`
                          px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                          ${page === currentPage
                            ? 'bg-blue-500 text-white'
                            : isDark 
                              ? 'hover:bg-slate-700 text-slate-300'
                              : 'hover:bg-slate-100 text-slate-700'
                          }
                        `}
                      >
                        {page}
                      </button>
                    </div>
                  ))}
              </div>
              
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