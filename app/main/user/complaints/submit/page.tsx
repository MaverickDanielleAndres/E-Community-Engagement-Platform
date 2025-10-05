// @/app/main/user/complaints/submit/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/ThemeContext'
import { Send, AlertTriangle, Upload, X, ArrowLeft } from 'lucide-react'

export default function SubmitComplaint() {
  const router = useRouter()
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other'
  })
  const [files, setFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/')
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
      return isValidType && isValidSize
    })

    if (validFiles.length !== newFiles.length) {
      alert('Some files were rejected. Only images/videos under 10MB are allowed.')
    }

    setFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('category', formData.category)

      files.forEach((file, index) => {
        formDataToSend.append(`media_${index}`, file)
      })

      const response = await fetch('/api/complaints', {
        method: 'POST',
        body: formDataToSend,
      })

      if (response.ok) {
        // Trigger sidebar refresh for admin users
        localStorage.setItem('sidebarRefresh', 'true')
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'sidebarRefresh',
          newValue: 'true'
        }))
        router.push('/main/user/complaints/my')
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error || 'Failed to submit complaint'}`)
      }
    } catch (error) {
      console.error('Error submitting complaint:', error)
      alert('Failed to submit complaint. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`max-w-2xl mx-auto space-y-6 ${isDark ? 'text-white' : 'text-black'}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            Submit Complaint
          </h1>
          <p className={`${isDark ? 'text-slate-400' : 'text-black'} mt-1`}>
            Report issues or concerns to the community administrators
          </p>
        </div>

        <button
          onClick={() => window.history.back()}
          className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isDark ? 'text-white border-gray-600 hover:bg-gray-700' : 'text-gray-700'
          }`}
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-black'} mb-2`}>
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-black'}`}
                placeholder="Brief description of the issue"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-black'} mb-2`}>
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-black'}`}
              >
                <option value="maintenance">Maintenance</option>
                <option value="governance">Governance</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-black'} mb-2`}>
                Description *
              </label>
              <textarea
                required
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-black'}`}
                placeholder="Provide detailed information about your complaint..."
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-black'} mb-2`}>
                Media (Images/Videos)
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : isDark
                    ? 'border-slate-600 hover:border-slate-500 bg-slate-800'
                    : 'border-slate-300 hover:border-slate-400 bg-white'
                }`}
                onDragEnter={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setDragActive(true)
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setDragActive(false)
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setDragActive(false)
                  const droppedFiles = Array.from(e.dataTransfer.files)
                  handleFiles(droppedFiles)
                }}
              >
                <Upload className={`mx-auto h-12 w-12 ${isDark ? 'text-white' : 'text-black'}`} />
                <p className={`mt-2 text-sm ${isDark ? 'text-white' : 'text-black'}`}>
                  Drag and drop images or videos here, or{' '}
                  <label className="text-blue-500 hover:text-blue-600 cursor-pointer">
                    browse
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const selectedFiles = Array.from(e.target.files || [])
                        handleFiles(selectedFiles)
                      }}
                    />
                  </label>
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-white' : 'text-black'}`}>
                  Supported formats: JPG, PNG, GIF, MP4, MOV (max 10MB each)
                </p>
              </div>

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        isDark ? 'bg-slate-700' : 'bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center">
                        {file.type.startsWith('image/') ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-8 h-8 object-cover rounded mr-2"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center mr-2">
                            <span className="text-white text-xs">VID</span>
                          </div>
                        )}
                        <div>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                            {file.name}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-white' : 'text-black'}`}>
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </div>
      </form>
    </div>
  )
}
