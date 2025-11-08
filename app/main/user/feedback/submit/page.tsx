// @/app/main/user/feedback/submit/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/ThemeContext'
import { Star, Send, Loader2, ArrowLeft } from 'lucide-react'
import { Toast } from '@/components/Toast'
import type { FormTemplate, FormField } from '@/types/feedback'

export default function SubmitFeedback() {
  const router = useRouter()
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(false)
  const [templateLoading, setTemplateLoading] = useState(true)
  const [template, setTemplate] = useState<FormTemplate | null>(null)
  const [formData, setFormData] = useState<Record<string, string | number | boolean>>({})
  const [hoveredRating, setHoveredRating] = useState(0)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetchTemplate()
  }, [])

  const fetchTemplate = async () => {
    try {
      const response = await fetch('/api/admin/feedback-form')
      if (response.ok) {
        const { template: fetchedTemplate } = await response.json()
        setTemplate(fetchedTemplate)
        // Initialize form data with default values
        const initialData: Record<string, string | number | boolean> = {
          feedback_for: 'None' // Default value for the feedback_for field
        }
        fetchedTemplate.fields.forEach((field: FormField) => {
          if (field.type === 'checkbox') {
            initialData[field.id] = false
          } else {
            initialData[field.id] = ''
          }
        })
        setFormData(initialData)
      } else {
        console.error('Failed to fetch template')
      }
    } catch (error) {
      console.error('Error fetching template:', error)
    } finally {
      setTemplateLoading(false)
    }
  }

  const handleFieldChange = (fieldId: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
  }

  const handleRatingChange = (fieldId: string, star: number) => {
    handleFieldChange(fieldId, star)
    setHoveredRating(0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!template) return

    // Validate required fields
    const hasErrors = template.fields.some((field: FormField) => {
      if (!field.required) return false
      const value = formData[field.id]
      if (field.type === 'checkbox') {
        return value !== true
      }
      return !value || value.toString().trim() === ''
    })
    if (hasErrors) {
      setToast({ message: 'Please fill all required fields', type: 'error' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_data: formData,
          template_id: template.id
        }),
      })

      if (response.ok) {
        setToast({ message: 'Feedback submitted successfully!', type: 'success' })
        setTimeout(() => router.push('/main/user/feedback/my'), 2000)
      } else {
        const error = await response.json()
        setToast({ message: error.error || 'Failed to submit feedback', type: 'error' })
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setToast({ message: 'Error submitting feedback', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  if (templateLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No feedback form available</p>
      </div>
    )
  }

  return (
    <div className={`max-w-2xl mx-auto space-y-6 ${isDark ? 'text-white bg-slate-900' : 'text-black bg-transparent'}`}>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => window.history.back()}
          className={`self-end sm:self-auto inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isDark ? 'text-white border-gray-600 hover:bg-gray-700' : 'text-gray-700'
          }`}
          aria-label="Back"
          disabled={loading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
        <div className="mt-2 sm:mt-0">
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            {template.title || 'Submit Feedback'}
          </h1>
          <p className={`mt-1 ${isDark ? 'text-slate-400' : 'text-black'}`}>
            {template.subtitle || 'Share your thoughts about the community'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                This feedback is for
              </label>
              <input
                type="text"
                value={formData.feedback_for as string || ''}
                onChange={(e) => handleFieldChange('feedback_for', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-gray-900'}`}
                placeholder="Enter what this feedback is for..."
              />
            </div>
            {template.fields.map((field: FormField) => (
              <div key={field.id}>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'rating' ? (
                  <div className="flex items-center space-x-2">
                    {Array.from({ length: field.options?.max || 5 }, (_, i) => i + 1).map((star: number) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(field.id, star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="p-1 transition-colors"
                      >
                        <span
                          className={`text-3xl ${
                            star <= (hoveredRating || (formData[field.id] as number))
                              ? 'opacity-100'
                              : 'opacity-50'
                          }`}
                        >
                          {field.options?.emojis?.[star - 1] || '⭐'}
                        </span>
                      </button>
                    ))}
                    {formData[field.id] && (
                      <span className="ml-4 text-sm text-gray-600 dark:text-gray-400">
                        {field.options?.labels?.[(formData[field.id] as number) - 1] || formData[field.id]}
                      </span>
                    )}
                  </div>
                ) : field.type === 'select' ? (
                  <select
                    value={formData[field.id] as string || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-gray-900'}`}
                    required={field.required}
                  >
                    <option value="">Select an option...</option>
                    {field.options?.choices?.map((choice, idx) => (
                      <option key={idx} value={choice}>{choice}</option>
                    ))}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData[field.id] === true}
                      onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                      required={field.required}
                    />
                    <span className={`text-sm ${isDark ? 'text-white' : 'text-black'}`}>
                      {field.label}
                    </span>
                  </label>
                ) : field.type === 'textarea' ? (
                  <textarea
                    rows={field.rows || 4}
                    value={formData[field.id] as string || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-gray-900'}`}
                    placeholder={field.placeholder || ''}
                    required={field.required}
                  />
                ) : (
                  <input
                    type={field.type === 'email' ? 'email' : 'text'}
                    value={formData[field.id] as string || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-gray-900'}`}
                    placeholder={field.placeholder || ''}
                    required={field.required}
                  />
                )}
                {field.description && (
                  <p className={`mt-1 text-sm ${isDark ? 'text-white' : 'text-black'}`}>{field.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !template}
            className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Feedback
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
