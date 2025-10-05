// app/main/admin/complaints/[complaintId]/page.tsx

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Dialog } from '@headlessui/react'
import { EmptyState, ConfirmDialog } from '@/components/mainapp/components'
import { useTheme } from '@/components/ThemeContext'
import { MessageSquareWarning, User, Calendar, Tag, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface ComplaintData {
  id: string
  title: string
  description: string
  category: string
  status: 'pending' | 'in-progress' | 'resolved'
  priority: number
  sentiment: number
  created_at: string
  updated_at: string
  media_urls?: string[]
  users: { name: string; email: string }
}

function MediaItem({ url, index }: { url: string; index: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const isVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg')

  return (
    <div className="relative">
      {isVideo ? (
        <video
          src={url}
          controls
          className="w-full h-48 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
          preload="metadata"
          onClick={() => setIsOpen(true)}
        >
          Your browser does not support the video tag.
        </video>
      ) : (
        <>
          <img
            src={url}
            alt={`Attachment ${index + 1}`}
            className="w-full h-48 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setIsOpen(true)}
          />
          <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
          <Dialog.Panel className="relative max-w-4xl max-h-full p-4">
              <img src={url} alt={`Attachment ${index + 1}`} className="max-w-full max-h-[80vh] rounded-lg" />
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-1 hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Close"
              >
                &#x2715;
              </button>
            </Dialog.Panel>
          </Dialog>
        </>
      )}
    </div>
  )
}

export default function ComplaintDetails() {
  const params = useParams()
  const complaintId = params.complaintId as string
  const { isDark } = useTheme()
  const [complaint, setComplaint] = useState<ComplaintData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [resolutionMessage, setResolutionMessage] = useState('')

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        const response = await fetch(`/api/complaints/${complaintId}`)
        if (response.ok) {
          const data = await response.json()
          setComplaint(data.complaint)
          setNewStatus(data.complaint?.status || '')
        } else if (response.status === 404) {
          console.error('Complaint not found:', complaintId)
          setComplaint(null)
        } else {
          console.error('Failed to fetch complaint:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Failed to fetch complaint:', error)
      } finally {
        setLoading(false)
      }
    }

    if (complaintId) {
      fetchComplaint()
    }
  }, [complaintId])

  const handleStatusUpdate = async () => {
    if (!complaint || newStatus === complaint.status) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
          resolution_message: resolutionMessage.trim() || undefined
        }),
      })

      const result = await response.json()

      if (response.ok && result.complaint) {
        setComplaint(result.complaint)
        setResolutionMessage('')
        // Set refresh flag for list page
        localStorage.setItem('complaintsListRefresh', 'true')
        // Set refresh flag for sidebar
        localStorage.setItem('sidebarRefresh', 'true')
      } else {
        console.error('Failed to update complaint:', result.error)
      }
    } catch (error) {
      console.error('Failed to update complaint:', error)
    }
    setUpdating(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'text-yellow-500' }
      case 'in-progress':
        return { icon: AlertTriangle, color: 'text-blue-500' }
      case 'resolved':
        return { icon: CheckCircle, color: 'text-green-500' }
      default:
        return { icon: Clock, color: 'text-gray-500' }
    }
  }

  const getSentimentColor = (sentiment: number) => {
    if (sentiment < -0.3) return 'text-red-500'
    if (sentiment > 0.3) return 'text-green-500'
    return 'text-yellow-500'
  }

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment < -0.3) return 'Negative'
    if (sentiment > 0.3) return 'Positive'
    return 'Neutral'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!complaint) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <MessageSquareWarning className={`w-16 h-16 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
        <div className="text-center">
          <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Complaint not found
          </h2>
          <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            The complaint you're looking for doesn't exist or has been deleted.
          </p>
          <Link
            href="/main/admin/complaints"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Back to Complaints List
          </Link>
        </div>
      </div>
    )
  }

  const statusIcon = getStatusIcon(complaint.status)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={`text-2xl font-bold text-gray-900 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {complaint.title}
          </h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Complaint #{complaint.id.slice(0, 8)}
          </p>
        </div>
      </div>

      {/* Complaint Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center">
            <statusIcon.icon className={`w-5 h-5 mr-2 ${statusIcon.color}`} />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status</p>
              <p className={`text-lg font-semibold capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {complaint.status.replace('-', ' ')}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center">
            <Tag className="w-5 h-5 mr-2 text-purple-500" />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Category</p>
              <p className={`text-lg font-semibold capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {complaint.category}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center">
            <AlertTriangle className={`w-5 h-5 mr-2 ${getSentimentColor(complaint.sentiment)}`} />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Sentiment</p>
              <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {getSentimentLabel(complaint.sentiment)}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-500" />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Submitted</p>
              <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {new Date(complaint.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Complaint Details */}
      <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Complaint Details
        </h2>

        <div className="space-y-4">
          <div>
            <h3 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Description
            </h3>
            <p className={`leading-relaxed ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {complaint.description}
            </p>
          </div>

          {complaint.media_urls && complaint.media_urls.length > 0 && (
            <div>
              <h3 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Media Attachments
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {complaint.media_urls.map((url, index) => (
                  <MediaItem key={index} url={url} index={index} />
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center pt-4 border-t border-slate-200 dark:border-slate-700">
            <User className="w-5 h-5 mr-2 text-gray-400" />
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Submitted by</p>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {complaint.users.name} ({complaint.users.email})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Update */}
      <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Update Status
        </h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="status" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Status
            </label>
            <select
              id="status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className={`
                w-full px-3 py-2 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
                ${isDark
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-slate-300 text-gray-900'
                }
              `}
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label htmlFor="resolution_message" className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Resolution Message (Optional)
            </label>
            <textarea
              id="resolution_message"
              rows={3}
              value={resolutionMessage}
              onChange={(e) => setResolutionMessage(e.target.value)}
              className={`
                w-full px-3 py-2 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
                ${isDark
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-slate-300 text-gray-900'
                }
              `}
              placeholder="Add any resolution message about this status update..."
            />
          </div>

          <button
            onClick={handleStatusUpdate}
            disabled={updating || newStatus === complaint.status}
            className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {updating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            {updating ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>

      {/* AI Insights */}
      <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          AI Analysis
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Sentiment Analysis
            </h3>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${getSentimentColor(complaint.sentiment).replace('text-', 'bg-')}`}></div>
              <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                {getSentimentLabel(complaint.sentiment)} ({(complaint.sentiment * 100).toFixed(1)}%)
              </span>
            </div>
          </div>

          <div>
            <h3 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Priority Level
            </h3>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                complaint.priority > 5 ? 'bg-red-500' :
                complaint.priority > 3 ? 'bg-yellow-500' : 'bg-green-500'
              }`}></div>
              <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                {complaint.priority > 5 ? 'High' :
                 complaint.priority > 3 ? 'Medium' : 'Low'} Priority
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
