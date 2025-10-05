// @/components/ui/ConfirmDialog.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle, X } from 'lucide-react'
import { useTheme } from '@/components/ThemeContext'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger' | 'success'
  loading?: boolean
  children?: React.ReactNode
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  children
}: ConfirmDialogProps) {
  const { isDark } = useTheme()

  const variants = {
    danger: {
      icon: AlertTriangle,
      iconBg: 'bg-red-100 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400',
      confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    },
    success: {
      icon: CheckCircle,
      iconBg: 'bg-green-100 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
      confirmButton: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
    },
    default: {
      icon: CheckCircle,
      iconBg: 'bg-blue-100 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    }
  }

  const config = variants[variant]
  const Icon = config.icon

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className={`
                  relative w-full max-w-md rounded-2xl p-6 shadow-2xl
                  ${isDark 
                    ? 'bg-slate-800 border border-slate-700' 
                    : 'bg-white border border-slate-200'
                  }
                `}
              >
                {/* Close button */}
                <button
                  onClick={onClose}
                  className={`
                    absolute top-4 right-4 p-1 rounded-lg transition-colors duration-200
                    ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}
                  `}
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Icon */}
                <div className={`mx-auto w-12 h-12 flex items-center justify-center rounded-full mb-4 ${config.iconBg}`}>
                  <Icon className={`w-6 h-6 ${config.iconColor}`} />
                </div>

                {/* Content */}
                <div className="text-center mb-6">
                  <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {title}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {description}
                  </p>
                  {children && (
                    <div className="mt-4">
                      {children}
                    </div>
                  )}
                </div>

                {/* Actions */}
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
                    className={`
                      flex-1 px-4 py-2 rounded-xl font-medium text-white transition-colors duration-200
                      ${config.confirmButton}
                      disabled:opacity-50 disabled:cursor-not-allowed
                      focus:outline-none focus:ring-2 focus:ring-offset-2
                    `}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
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
        </>
      )}
    </AnimatePresence>
  )
}