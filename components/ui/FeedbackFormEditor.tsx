"use client"

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@/components/ThemeContext'
import { Toast } from '@/components/Toast'
import { FormField, FormTemplate } from '@/types/feedback'
import {
  Plus, X, Edit, Save, Eye, EyeOff, Settings,
  Star, MessageSquare, CheckSquare, Type, List,
  GripVertical, Trash2, ChevronDown, ChevronUp,
  Copy, RotateCcw, AlertCircle, CheckCircle2,
  Smartphone, Monitor, Palette
} from 'lucide-react'

export default function FeedbackFormEditor() {
  const { isDark } = useTheme()
  const [template, setTemplate] = useState<FormTemplate | null>(null)
  const [originalTemplate, setOriginalTemplate] = useState<FormTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    fetchTemplate()
  }, [])

  useEffect(() => {
    if (originalTemplate && template) {
      const hasChanges = JSON.stringify(originalTemplate) !== JSON.stringify(template)
      setHasUnsavedChanges(hasChanges)
    }
  }, [template, originalTemplate])

  const fetchTemplate = async () => {
    try {
      const res = await fetch('/api/admin/feedback-form')
      if (res.ok) {
        const { template: fetchedTemplate } = await res.json()
        setTemplate(fetchedTemplate)
        setOriginalTemplate(fetchedTemplate)
      } else {
        console.error('Failed to fetch template')
      }
    } catch (error) {
      console.error('Error fetching template:', error)
    } finally {
      setLoading(false)
    }
  }

  const addField = useCallback((type: FormField['type']) => {
    if (!template) return

    const newField: FormField = {
      id: Date.now().toString(),
      type,
      label: getDefaultLabel(type),
      required: false,
      placeholder: type === 'text' || type === 'textarea' ? 'Enter your response...' : undefined,
      options: type === 'rating' ? { max: 5, emojis: ['⭐', '⭐', '⭐', '⭐', '⭐'], labels: [] } : undefined
    }

    setTemplate({
      ...template,
      fields: [...template.fields, newField]
    })
    setExpandedFields(prev => new Set([...prev, newField.id]))
  }, [template])

  const removeField = useCallback((fieldId: string) => {
    if (!template) return

    setTemplate({
      ...template,
      fields: template.fields.filter(f => f.id !== fieldId)
    })
    setExpandedFields(prev => {
      const newSet = new Set(prev)
      newSet.delete(fieldId)
      return newSet
    })
  }, [template])

  const updateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
    if (!template) return

    setTemplate({
      ...template,
      fields: template.fields.map(f =>
        f.id === fieldId ? { ...f, ...updates } : f
      )
    })
  }, [template])

  const saveTemplate = async () => {
    if (!template) return

    setSaving(true)
    try {
      const response = await fetch('/api/admin/feedback-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template })
      })

      if (response.ok) {
        setOriginalTemplate(template)
        setHasUnsavedChanges(false)
        setToast({ message: 'Form template saved successfully!', type: 'success' })
      } else {
        const error = await response.json()
        setToast({ message: error.error || 'Failed to save template', type: 'error' })
      }
    } catch (error) {
      console.error('Error saving template:', error)
      setToast({ message: 'Error saving template', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const duplicateField = useCallback((fieldId: string) => {
    if (!template) return

    const fieldToDuplicate = template.fields.find(f => f.id === fieldId)
    if (!fieldToDuplicate) return

    const duplicatedField: FormField = {
      ...fieldToDuplicate,
      id: Date.now().toString(),
      label: `${fieldToDuplicate.label} (Copy)`
    }

    setTemplate({
      ...template,
      fields: [...template.fields, duplicatedField]
    })
    setExpandedFields(prev => new Set([...prev, duplicatedField.id]))
  }, [template])

  const moveField = useCallback((fieldId: string, direction: 'up' | 'down') => {
    if (!template) return

    const index = template.fields.findIndex(f => f.id === fieldId)
    if (index === -1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= template.fields.length) return

    const newFields = [...template.fields]
    const [movedField] = newFields.splice(index, 1)
    newFields.splice(newIndex, 0, movedField)

    setTemplate({
      ...template,
      fields: newFields
    })
  }, [template])

  const toggleFieldExpansion = useCallback((fieldId: string) => {
    setExpandedFields(prev => {
      const newSet = new Set(prev)
      if (newSet.has(fieldId)) {
        newSet.delete(fieldId)
      } else {
        newSet.add(fieldId)
      }
      return newSet
    })
  }, [])

  const getDefaultLabel = (type: FormField['type']) => {
    switch (type) {
      case 'rating': return 'How would you rate our service?'
      case 'textarea': return 'Please share your detailed feedback'
      case 'text': return 'Your answer'
      case 'select': return 'Choose an option'
      case 'checkbox': return 'I agree to the terms'
      default: return 'New field'
    }
  }

  const getFieldIcon = (type: FormField['type']) => {
    switch (type) {
      case 'rating': return <Star className="w-4 h-4 text-yellow-500" />
      case 'textarea': return <MessageSquare className="w-4 h-4 text-blue-500" />
      case 'text': return <Type className="w-4 h-4 text-green-500" />
      case 'select': return <List className="w-4 h-4 text-purple-500" />
      case 'checkbox': return <CheckSquare className="w-4 h-4 text-pink-500" />
      default: return <Type className="w-4 h-4 text-gray-500" />
    }
  }

  const getFieldTypeDescription = (type: FormField['type']) => {
    switch (type) {
      case 'rating': return 'Star rating with custom labels'
      case 'textarea': return 'Multi-line text input'
      case 'text': return 'Single-line text input'
      case 'select': return 'Dropdown selection'
      case 'checkbox': return 'Yes/No or agreement field'
      default: return 'Custom field type'
    }
  }

  const renderFieldEditor = (field: FormField, index: number) => {
    const isExpanded = expandedFields.has(field.id)

    return (
      <div
        key={field.id}
        className={`border rounded-xl transition-all duration-200 ${
          isDark ? 'border-slate-600 bg-slate-800/50' : 'border-slate-200 bg-white'
        } ${isExpanded ? 'ring-2 ring-blue-500/20' : 'hover:shadow-md'}`}
      >
        {/* Field Header */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer"
          onClick={() => toggleFieldExpansion(field.id)}
        >
          <div className="flex items-center space-x-3">
            <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
            {getFieldIcon(field.type)}
            <div>
              <h4 className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {field.label || 'Untitled Field'}
              </h4>
              <p className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {getFieldTypeDescription(field.type)}
              </p>
            </div>
            {field.required && (
              <span className="text-red-500 text-sm font-medium">*</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                duplicateField(field.id)
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded"
              title="Duplicate field"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                moveField(field.id, 'up')
              }}
              disabled={index === 0}
              className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-50 rounded"
              title="Move up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                moveField(field.id, 'down')
              }}
              disabled={index === template!.fields.length - 1}
              className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-50 rounded"
              title="Move down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                removeField(field.id)
              }}
              className="p-1 text-red-400 hover:text-red-600 rounded"
              title="Delete field"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>

        {/* Field Configuration */}
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700">
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>
                    Field Label
                  </label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-blue-500'
                    }`}
                    placeholder="Enter field label..."
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>
                    Field Type
                  </label>
                  <select
                    value={field.type}
                    onChange={(e) => updateField(field.id, { type: e.target.value as FormField['type'] })}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  >
                    <option value="rating">⭐ Rating</option>
                    <option value="textarea">📝 Text Area</option>
                    <option value="text">🔤 Text Input</option>
                    <option value="select">📋 Select</option>
                    <option value="checkbox">☑️ Checkbox</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(field.id, { required: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                  />
                  <span className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Required field
                  </span>
                </label>
              </div>

              {/* Type-specific options */}
              {field.type === 'rating' && (
                <div className="space-y-3">
                  <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Rating Scale (1-{field.options?.max || 5})
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: field.options?.max || 5 }, (_, i) => i + 1).map((rating) => (
                      <div key={rating} className="text-center">
                        <div className="text-2xl mb-1">
                          {field.options?.emojis?.[rating - 1] || '⭐'}
                        </div>
                        <input
                          type="text"
                          value={field.options?.labels?.[rating - 1] || ''}
                          onChange={(e) => {
                            const newLabels = [...(field.options?.labels || [])]
                            newLabels[rating - 1] = e.target.value
                            updateField(field.id, {
                              options: { ...field.options, labels: newLabels }
                            })
                          }}
                          className={`w-full px-2 py-1 text-xs border rounded transition-colors ${
                            isDark
                              ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500'
                              : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-blue-500'
                          }`}
                          placeholder={`Label ${rating}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {field.type === 'select' && (
                <div className="space-y-3">
                  <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Options
                  </label>
                  {field.options?.choices?.map((choice, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={choice}
                        onChange={(e) => {
                          const newChoices = [...(field.options?.choices || [])]
                          newChoices[idx] = e.target.value
                          updateField(field.id, {
                            options: { ...field.options, choices: newChoices }
                          })
                        }}
                        className={`flex-1 px-3 py-2 border rounded-lg transition-colors ${
                          isDark
                            ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500'
                            : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                        }`}
                        placeholder={`Option ${idx + 1}`}
                      />
                      <button
                        onClick={() => {
                          const newChoices = (field.options?.choices || []).filter((_, i) => i !== idx)
                          updateField(field.id, {
                            options: { ...field.options, choices: newChoices }
                          })
                        }}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove option"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newChoices = [...(field.options?.choices || []), '']
                      updateField(field.id, {
                        options: { ...field.options, choices: newChoices }
                      })
                    }}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm dark:text-white">Add Option</span>
                  </button>
                </div>
              )}

              {(field.type === 'textarea' || field.type === 'text') && (
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>
                    Placeholder Text
                  </label>
                  <input
                    type="text"
                    value={field.placeholder || ''}
                    onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-blue-500'
                    }`}
                    placeholder="Enter placeholder text..."
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderPreview = () => (
    <div className={`rounded-xl border ${
      isDark ? 'border-slate-600 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900'
    }`}>
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Live Preview
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`p-2 rounded-lg transition-colors ${
                previewMode === 'desktop'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Desktop view"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-2 rounded-lg transition-colors ${
                previewMode === 'mobile'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Mobile view"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className={`p-6 ${previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''}`}>
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              {template?.title}
            </h2>
            <p className="text-white">
              {template?.subtitle}
            </p>
          </div>

          <form className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              This feedback is for:
            </label>
            <input
              type="text"
              value="None"
              disabled
              className={`w-full px-3 py-2 border rounded-lg transition-colors disabled:opacity-100 ${
                isDark
                  ? 'bg-slate-800 border-slate-600 !text-white focus:border-blue-500'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
              }`}
            />
          </div>
          {template?.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <label className="block text-sm font-medium text-white">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>

              {field.type === 'rating' && (
                <div className="space-y-4">
                  <div className="flex justify-center space-x-4">
                    {Array.from({ length: field.options?.max || 5 }, (_, i) => i + 1).map((rating) => (
                      <div key={rating} className="text-center cursor-pointer hover:scale-110 transition-transform">
                        <div className="text-3xl mb-1">
                          {field.options?.emojis?.[rating - 1] || '⭐'}
                        </div>
                        <div className="text-xs text-white">
                          {field.options?.labels?.[rating - 1] || rating.toString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {field.type === 'textarea' && (
                <textarea
                  placeholder={field.placeholder}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg transition-colors bg-slate-800 border-slate-600 text-white focus:border-blue-500`}
                  disabled
                />
              )}

              {field.type === 'text' && (
                <input
                  type="text"
                  placeholder={field.placeholder}
                  className={`w-full px-3 py-2 border rounded-lg transition-colors bg-slate-800 border-slate-600 text-white focus:border-blue-500`}
                  disabled
                />
              )}

              {field.type === 'select' && (
                <select
                  className="w-full px-3 py-2 border rounded-lg transition-colors bg-slate-800 border-slate-600 text-white focus:border-blue-500"
                  disabled
                >
                  <option>Select an option...</option>
                  {field.options?.choices?.map((choice, idx) => (
                    <option key={idx} value={choice}>{choice}</option>
                  ))}
                </select>
              )}

              {field.type === 'checkbox' && (
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                    disabled
                  />
                  <span className="text-sm text-white">
                    {field.label}
                  </span>
                </label>
              )}
              </div>
            ))}

            <button
              type="button"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled
            >
              Submit Feedback
            </button>
          </form>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="text-slate-600 dark:text-white">Loading form editor...</span>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>
          Failed to Load Form Template
        </h3>
        <p className={`text-slate-600 ${isDark ? 'text-white' : ''} mb-4`}>
          There was an error loading the feedback form template.
        </p>
        <button
          onClick={fetchTemplate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
          <div className={`rounded-xl border p-6 ${
            isDark ? 'border-slate-600 bg-slate-800' : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center space-x-2`}>
                  <Palette className="w-6 h-6 text-blue-500" />
                  <span>Feedback Form Editor</span>
                </h1>
                <p className={`${isDark ? 'text-white' : 'text-slate-900'} mt-1`}>
                  Design and customize your community feedback form
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {hasUnsavedChanges && (
                  <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Unsaved changes</span>
                  </div>
                )}
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    showPreview
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      : `${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'}`
                  }`}
                >
                  {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
              </button>
              <button
                onClick={saveTemplate}
                disabled={saving || !hasUnsavedChanges}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
          </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Editor Panel */}
        <div className="space-y-6">
          {/* Form Settings */}
          <div className={`rounded-xl border p-6 ${
            isDark ? 'border-slate-600 bg-slate-800' : 'border-slate-200 bg-white'
          }`}>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'} mb-4 flex items-center space-x-2`}>
            <Settings className="w-5 h-5 text-slate-500" />
            <span>Form Settings</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>
                Form Title
              </label>
                <input
                  type="text"
                  value={template.title}
                  onChange={(e) => setTemplate({ ...template, title: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-blue-500'
                  }`}
                  placeholder="Enter form title..."
                />
            </div>

            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>
                Subtitle
              </label>
              <input
                type="text"
                value={template.subtitle}
                onChange={(e) => setTemplate({ ...template, subtitle: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                  isDark
                    ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-blue-500'
                }`}
                placeholder="Enter form subtitle..."
              />
            </div>
          </div>
          </div>

          {/* Add Field */}
          <div className={`rounded-xl border p-6 ${
            isDark ? 'border-slate-600 bg-slate-800' : 'border-slate-200 bg-white'
          }`}>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'} mb-4 flex items-center space-x-2`}>
                <Plus className={`w-5 h-5 ${isDark ? 'text-white' : 'text-slate-500'}`} />
                <span className={isDark ? 'text-white' : 'text-slate-900'}>Add Field</span>
              </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { type: 'rating' as const, icon: Star, color: 'text-yellow-500', bg: 'hover:bg-yellow-50 dark:hover:bg-yellow-900/20' },
                { type: 'textarea' as const, icon: MessageSquare, color: 'text-blue-500', bg: 'hover:bg-blue-50 dark:hover:bg-blue-900/20' },
                { type: 'text' as const, icon: Type, color: 'text-green-500', bg: 'hover:bg-green-50 dark:hover:bg-green-900/20' },
                { type: 'select' as const, icon: List, color: 'text-purple-500', bg: 'hover:bg-purple-50 dark:hover:bg-purple-900/20' },
                { type: 'checkbox' as const, icon: CheckSquare, color: 'text-pink-500', bg: 'hover:bg-pink-50 dark:hover:bg-pink-900/20' },
              ].map(({ type, icon: Icon, color, bg }) => (
                <button
                  key={type}
                  onClick={() => addField(type)}
                  className={`group p-4 border rounded-xl text-left transition-all duration-200 ${bg} ${
                    isDark
                      ? 'border-slate-600 hover:border-slate-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-6 h-6 mb-2 ${color}`} />
                  <div className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'} group-hover:text-slate-700 dark:group-hover:text-slate-300 capitalize`}>
                    {type === 'rating' ? 'Star Rating' : type === 'textarea' ? 'Text Area' : type}
                  </div>
                  <div className={`text-sm ${isDark ? 'text-white' : 'text-slate-900'} group-hover:text-slate-700 dark:group-hover:text-slate-300`}>
                    {getFieldTypeDescription(type)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Fields List */}
          <div className={`rounded-xl border p-6 ${
            isDark ? 'border-slate-600 bg-slate-800' : 'border-slate-200 bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'} flex items-center space-x-2`}>
                <Edit className={`w-5 h-5 ${isDark ? 'text-white' : 'text-slate-500'}`} />
                <span>Form Fields ({template.fields.length})</span>
              </h3>
              {template.fields.length > 0 && (
                <button
                  onClick={() => setExpandedFields(new Set(template.fields.map(f => f.id)))}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Expand All
                </button>
              )}
            </div>

            {template.fields.length === 0 ? (
              <div className="text-center py-8">
                <Type className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h4 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>
                  No Fields Added Yet
                </h4>
                <p className={`text-slate-600 dark:text-white mb-4`}>
                  Start building your form by adding fields from the section above.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {template.fields.map((field, idx) => renderFieldEditor(field, idx))}
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="xl:sticky xl:top-6">
          {showPreview && renderPreview()}
        </div>
      </div>
    </div>
  )
}
