'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Toast } from '@/components/Toast'
import { Button } from '@/components/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useTheme } from '@/components/ThemeContext'
import {
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  EyeIcon,
  DocumentIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

interface VerificationRequest {
  id: string
  user_id: string
  full_name: string
  age: number
  gender: string
  address: string
  id_number: string
  front_id_url: string | null
  back_id_url: string | null
  status: string
  created_at: string
  email: string
}

export default function ViewRequestPage() {
  const params = useParams()
  const router = useRouter()
  const requestId = params.requestId as string
  const { isDark } = useTheme()

  const [request, setRequest] = useState<VerificationRequest | null>(null)
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

  const [brokenImages, setBrokenImages] = useState<{ front: boolean; back: boolean }>({ front: false, back: false })
  const [imageModal, setImageModal] = useState<{
    isOpen: boolean
    imageUrl: string | null
    title: string
  }>({
    isOpen: false,
    imageUrl: null,
    title: ''
  })


  const fetchRequest = async () => {
    try {
      const response = await fetch(`/api/admin/verification-requests/${requestId}`)
      const result = await response.json()

      if (response.ok && result.success) {
        setRequest(result.request)
      } else {
        setToast({ message: result.message || 'Failed to load request', type: 'error' })
      }
    } catch (error) {
      console.error('Fetch request error:', error)
      setToast({ message: 'Network error', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageError = (side: 'front' | 'back') => {
    setBrokenImages(prev => ({ ...prev, [side]: true }))
  }

  const openImageModal = (url: string, title: string) => {
    setImageModal({
      isOpen: true,
      imageUrl: url,
      title
    })
  }

  const closeImageModal = () => {
    setImageModal({
      isOpen: false,
      imageUrl: null,
      title: ''
    })
  }



  useEffect(() => {
    if (requestId) {
      fetchRequest()
    }
  }, [requestId])

  const handleAction = async (action: 'approve' | 'reject' | 'delete') => {
    // Close the confirmation modal first
    setConfirmDialog({ ...confirmDialog, isOpen: false })

    try {
      const response = await fetch('/api/admin/verification-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id: requestId })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setToast({ message: result.message, type: 'success' })
        setTimeout(() => {
          router.push('/main/admin/requests')
        }, 2000)
      } else {
        setToast({ message: result.message || 'Action failed', type: 'error' })
      }
    } catch (error) {
      console.error('Action error:', error)
      setToast({ message: 'Network error', type: 'error' })
    }
  }

  const confirmAction = (action: 'approve' | 'reject' | 'delete') => {
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
      action: () => handleAction(action)
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    )
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className={isDark ? 'text-white' : 'text-black'}>Request not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
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

      {/* Image Modal */}
      {imageModal.isOpen && imageModal.imageUrl && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={closeImageModal}
            className="absolute top-4 right-4 z-10 bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </Button>
          <div className="relative max-w-[90vw] max-h-[90vh] w-full h-full flex items-center justify-center">
            <img
              src={imageModal.imageUrl}
              alt={imageModal.title}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onError={() => {
                const img = document.querySelector(`img[alt="${imageModal.title}"]`) as HTMLImageElement
                if (img) {
                  img.style.display = 'none'
                  const errorDiv = document.createElement('div')
                  errorDiv.className = 'bg-white dark:bg-slate-800 rounded-lg p-6 text-center'
                  errorDiv.innerHTML = '<p class="text-slate-600 dark:text-slate-400">Failed to load image.</p>'
                  const closeBtn = document.createElement('button')
                  closeBtn.className = 'mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
                  closeBtn.textContent = 'Close'
                  closeBtn.onclick = closeImageModal
                  errorDiv.appendChild(closeBtn)
                  img.parentElement?.appendChild(errorDiv)
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`flex flex-col gap-4 ${isDark ? 'bg-slate-900' : 'bg-white'} p-4 rounded-lg`}>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/main/admin/requests')}
            className={`shrink-0 ${isDark ? 'bg-slate-800 text-white border border-slate-700 hover:bg-slate-700' : ''}`}
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Back to Requests</span>
          </Button>

          <div>
            <h1 className={`text-xl md:text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Verification Request
            </h1>
            <p className={`text-sm md:text-base ${isDark ? 'text-white' : 'text-black'}`}>
              Review request details and ID documents
            </p>
          </div>
        </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium w-fit ${
              request.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : request.status === 'approved'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </span>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => confirmAction('approve')}
                className={`text-white hover:text-black border-green-600 hover:border-green-700 ${isDark ? 'bg-green-900/80 dark:border-green-800 dark:hover:bg-green-900/90' : 'bg-green-600 hover:bg-green-700'} flex-1 sm:flex-none`}
                disabled={request.status === 'approved'}
              >
                <CheckIcon className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="outline"
                onClick={() => confirmAction('reject')}
                className={`text-white hover:text-black border-red-600 hover:border-red-700 ${isDark ? 'bg-red-900/80 dark:border-red-800 dark:hover:bg-red-900/90' : 'bg-red-600 hover:bg-red-700'} flex-1 sm:flex-none`}
                disabled={request.status === 'rejected'}
              >
                <XMarkIcon className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                variant="outline"
                onClick={() => confirmAction('delete')}
                className={`text-white hover:text-black border-gray-600 hover:border-gray-700 ${isDark ? 'bg-gray-900/80 dark:border-gray-800 dark:hover:bg-gray-900/90' : 'bg-gray-600 hover:bg-gray-700'} flex-1 sm:flex-none`}
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-1"
        >
          <div className={`${isDark ? 'bg-slate-900' : 'bg-white'} rounded-2xl p-4 md:p-8 border ${isDark ? 'border-slate-700' : 'border-slate-200'} shadow-sm`}>
            <h2 className={`text-lg font-semibold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
              <UserIcon className="w-5 h-5" />
              Personal Information
            </h2>

            <div className="space-y-4 md:space-y-6">
              <div>
                <label className={`text-sm font-medium mb-1 block ${isDark ? 'text-white' : 'text-black'}`}>Full Name</label>
                <p className={`${isDark ? 'text-white' : 'text-black'} font-medium`}>{request.full_name}</p>
              </div>

              <div>
                <label className={`text-sm font-medium mb-1 block ${isDark ? 'text-white' : 'text-black'}`}>Email</label>
                <p className={`${isDark ? 'text-white' : 'text-black'} font-medium break-all`}>{request.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm font-medium mb-1 block ${isDark ? 'text-white' : 'text-black'}`}>Age</label>
                  <p className={`${isDark ? 'text-white' : 'text-black'}`}>{request.age} years old</p>
                </div>
                <div>
                  <label className={`text-sm font-medium mb-1 block ${isDark ? 'text-white' : 'text-black'}`}>Gender</label>
                  <p className={`${isDark ? 'text-white' : 'text-black'}`}>{request.gender}</p>
                </div>
              </div>

              <div>
                <label className={`text-sm font-medium mb-1 block flex items-center gap-1 ${isDark ? 'text-white' : 'text-black'}`}>
                  <MapPinIcon className="w-4 h-4" />
                  Address
                </label>
                <p className={`${isDark ? 'text-white' : 'text-black'}`}>{request.address}</p>
              </div>

              <div>
                <label className={`text-sm font-medium mb-1 block flex items-center gap-1 ${isDark ? 'text-white' : 'text-black'}`}>
                  <DocumentIcon className="w-4 h-4" />
                  ID Number
                </label>
                <p className={`${isDark ? 'text-white' : 'text-black'} font-mono`}>{request.id_number}</p>
              </div>

              <div>
                <label className={`text-sm font-medium mb-1 block flex items-center gap-1 ${isDark ? 'text-white' : 'text-black'}`}>
                  <CalendarIcon className="w-4 h-4" />
                  Submitted
                </label>
                <p className={`${isDark ? 'text-white' : 'text-black'} text-sm`}>
                  {new Date(request.created_at).toLocaleDateString()} at {new Date(request.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ID Documents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-2"
        >
          <div className={`${isDark ? 'bg-slate-900' : 'bg-white'} rounded-2xl p-4 md:p-8 border ${isDark ? 'border-slate-700' : 'border-slate-200'} shadow-sm`}>
            <h2 className={`text-lg font-semibold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
              <EyeIcon className="w-5 h-5" />
              ID Documents
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {/* Front ID */}
              <div>
                <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
                  Front of ID
                </h3>
                <div className="relative group">
                  {brokenImages.front || !request.front_id_url ? (
                    <div className="aspect-video bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600">
                      <DocumentIcon className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                      <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Image not available</p>
                    </div>
                  ) : (
                    <div
                      onClick={() => openImageModal(request.front_id_url!, 'Front of ID')}
                      className="block aspect-video rounded-lg overflow-hidden group cursor-pointer hover:scale-105 transition-transform duration-200 shadow-md hover:shadow-lg"
                    >
                      <img
                        src={request.front_id_url}
                        alt={`${request.full_name} - Front ID`}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError('front')}
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                        <EyeIcon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Back ID */}
              <div>
                <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
                  Back of ID
                </h3>
                <div className="relative group">
                  {brokenImages.back || !request.back_id_url ? (
                    <div className="aspect-video bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600">
                      <DocumentIcon className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                      <p className={`text-sm mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Image not available</p>
                    </div>
                  ) : (
                    <div
                      onClick={() => openImageModal(request.back_id_url!, 'Back of ID')}
                      className="block aspect-video rounded-lg overflow-hidden group cursor-pointer hover:scale-105 transition-transform duration-200 shadow-md hover:shadow-lg"
                    >
                      <img
                        src={request.back_id_url}
                        alt={`${request.full_name} - Back ID`}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError('back')}
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                        <EyeIcon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
