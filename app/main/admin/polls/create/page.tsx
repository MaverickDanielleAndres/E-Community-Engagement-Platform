// @/app/main/admin/polls/create/page.tsx - Google Forms style with live preview
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/ThemeContext'
import { Toast } from '@/components/Toast'
import { 
  Plus, X, Save, Eye, EyeOff, GripVertical, Copy, 
  ChevronUp, ChevronDown, Trash2, Type, RadioIcon, 
  CheckSquare, Settings, Smartphone, Monitor, MessageSquare
} from 'lucide-react'

interface PollQuestion {
  id: string
  type: 'radio' | 'checkbox' | 'text'
  question: string
  options?: string[]
  required: boolean
}

interface PollData {
  title: string
  description: string
  deadline: string
  is_anonymous: boolean
  questions: PollQuestion[]
  footer_note: string
  complaint_link: string
}

export default function CreatePoll() {
  const router = useRouter()
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const [formData, setFormData] = useState<PollData>({
    title: '',
    description: '',
    deadline: '',
    is_anonymous: false,
    questions: [],
    footer_note: 'If you have any concerns or complaints, please feel free to contact us.',
    complaint_link: '/main/complaints'
  })

  const addQuestion = (type: PollQuestion['type'] = 'radio') => {
    const newQuestion: PollQuestion = {
      id: Date.now().toString(),
      type,
      question: '',
      options: type === 'radio' ? ['Option 1', 'Option 2'] : undefined,
      required: true
    }
    
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }))
    
    setExpandedQuestions(prev => new Set([...prev, newQuestion.id]))
  }

  const updateQuestion = (questionId: string, updates: Partial<PollQuestion>) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      )
    }))
  }

  const removeQuestion = (questionId: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }))
    setExpandedQuestions(prev => {
      const newSet = new Set(prev)
      newSet.delete(questionId)
      return newSet
    })
  }

  const duplicateQuestion = (questionId: string) => {
    const questionToDuplicate = formData.questions.find(q => q.id === questionId)
    if (!questionToDuplicate) return

    const duplicated: PollQuestion = {
      ...questionToDuplicate,
      id: Date.now().toString(),
      question: `${questionToDuplicate.question} (Copy)`
    }

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, duplicated]
    }))
    setExpandedQuestions(prev => new Set([...prev, duplicated.id]))
  }

  const moveQuestion = (questionId: string, direction: 'up' | 'down') => {
    const currentIndex = formData.questions.findIndex(q => q.id === questionId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= formData.questions.length) return

    setFormData(prev => {
      const newQuestions = [...prev.questions]
      const [movedQuestion] = newQuestions.splice(currentIndex, 1)
      newQuestions.splice(newIndex, 0, movedQuestion)
      return { ...prev, questions: newQuestions }
    })
  }

  const updateQuestionOption = (questionId: string, optionIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId && q.options) {
          const newOptions = [...q.options]
          newOptions[optionIndex] = value
          return { ...q, options: newOptions }
        }
        return q
      })
    }))
  }

  const addQuestionOption = (questionId: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId && q.options) {
          return { ...q, options: [...q.options, `Option ${q.options.length + 1}`] }
        }
        return q
      })
    }))
  }

  const removeQuestionOption = (questionId: string, optionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => {
        if (q.id === questionId && q.options && q.options.length > 2) {
          const newOptions = q.options.filter((_, i) => i !== optionIndex)
          return { ...q, options: newOptions }
        }
        return q
      })
    }))
  }

  const toggleQuestionExpansion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validate form
    if (!formData.title.trim()) {
      setToast({ message: 'Poll title is required', type: 'error' })
      setLoading(false)
      return
    }

    if (formData.questions.length === 0) {
      setToast({ message: 'At least 1 question is required', type: 'error' })
      setLoading(false)
      return
    }

    // Validate questions
    const validationErrors: string[] = []
    formData.questions.forEach((question, index) => {
      if (!question.question.trim()) {
        validationErrors.push(`Question ${index + 1} is required`)
      }
      if (question.type === 'radio' && (!question.options || question.options.some(opt => !opt.trim()))) {
        validationErrors.push(`Question ${index + 1} must have valid options`)
      }
    })

    if (validationErrors.length > 0) {
      setToast({ message: validationErrors.join(', '), type: 'error' })
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setToast({ message: 'Poll created successfully', type: 'success' })
        setTimeout(() => {
          router.push('/main/admin/polls')
        }, 1500)
      } else {
        const errorData = await response.json()
        setToast({ message: errorData.error || 'Failed to create poll', type: 'error' })
      }
    } catch (error) {
      console.error('Error creating poll:', error)
      setToast({ message: 'Failed to create poll', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const getQuestionIcon = (type: PollQuestion['type']) => {
    switch (type) {
      case 'radio': return <RadioIcon className="w-4 h-4 text-blue-500" />
      case 'checkbox': return <CheckSquare className="w-4 h-4 text-green-500" />
      case 'text': return <Type className="w-4 h-4 text-purple-500" />
      default: return <Type className="w-4 h-4 text-gray-500" />
    }
  }

  const renderQuestionEditor = (question: PollQuestion, index: number) => {
    const isExpanded = expandedQuestions.has(question.id)

    return (
      <div
        key={question.id}
        className={`border rounded-xl transition-all duration-200 ${
          isDark ? 'border-slate-600 bg-slate-800/50' : 'border-slate-200 bg-white'
        } ${isExpanded ? 'ring-2 ring-blue-500/20' : 'hover:shadow-md'}`}
      >
        {/* Question Header */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer"
          onClick={() => toggleQuestionExpansion(question.id)}
        >
          <div className="flex items-center space-x-3">
            <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
            {getQuestionIcon(question.type)}
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white">
                {question.question || `Question ${index + 1}`}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {question.type === 'radio' ? 'Multiple Choice' : question.type === 'text' ? 'Short Answer' : 'Checkboxes'}
              </p>
            </div>
            {question.required && (
              <span className="text-red-500 text-sm font-medium">*</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                duplicateQuestion(question.id)
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded"
              title="Duplicate question"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                moveQuestion(question.id, 'up')
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
                moveQuestion(question.id, 'down')
              }}
              disabled={index === formData.questions.length - 1}
              className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-50 rounded"
              title="Move down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                removeQuestion(question.id)
              }}
              className="p-1 text-red-400 hover:text-red-600 rounded"
              title="Delete question"
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

        {/* Question Configuration */}
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700">
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Question
                  </label>
                  <input
                    type="text"
                    value={question.question}
                    onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                    placeholder="Enter your question..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Question Type
                  </label>
                  <select
                    value={question.type}
                    onChange={(e) => updateQuestion(question.id, { 
                      type: e.target.value as PollQuestion['type'],
                      options: e.target.value === 'radio' ? ['Option 1', 'Option 2'] : undefined
                    })}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  >
                    <option value="radio">📻 Multiple Choice</option>
                    <option value="text">📝 Short Answer</option>
                    <option value="checkbox">☑️ Checkboxes</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Required
                  </span>
                </label>
              </div>

              {/* Options for radio/checkbox questions */}
              {question.type === 'radio' && question.options && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Options
                  </label>
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-slate-400 rounded-full flex-shrink-0"></div>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateQuestionOption(question.id, optionIndex, e.target.value)}
                        className={`flex-1 px-3 py-2 border rounded-lg transition-colors ${
                          isDark
                            ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500'
                            : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                        }`}
                        placeholder={`Option ${optionIndex + 1}`}
                      />
                      {question.options!.length > 2 && (
                        <button
                          onClick={() => removeQuestionOption(question.id, optionIndex)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Remove option"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addQuestionOption(question.id)}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Add Option</span>
                  </button>
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
      isDark ? 'border-slate-600 bg-slate-900' : 'border-slate-200 bg-white'
    }`}>
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
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
          {/* Poll Header */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {formData.title || 'Untitled Poll'}
            </h2>
            {formData.description && (
              <p className="text-slate-600 dark:text-slate-400">
                {formData.description}
              </p>
            )}
          </div>

          {/* Questions */}
          <form className="space-y-6">
            {formData.questions.map((question, index) => (
              <div key={question.id} className="space-y-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {index + 1}. {question.question || `Question ${index + 1}`}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {question.type === 'radio' && question.options && (
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                          disabled
                        />
                        <span className="text-slate-700 dark:text-slate-300">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'text' && (
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                      isDark
                        ? 'bg-slate-800 border-slate-600 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                    placeholder="Your answer"
                    disabled
                  />
                )}

                {question.type === 'checkbox' && question.options && (
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                          disabled
                        />
                        <span className="text-slate-700 dark:text-slate-300">{option}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {formData.questions.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400">
                  Add questions to see the preview
                </p>
              </div>
            )}

            {/* Footer */}
            {formData.questions.length > 0 && (
              <>
                <button
                  type="button"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled
                >
                  Submit
                </button>

                {formData.footer_note && (
                  <div className="text-center text-sm text-slate-500 dark:text-slate-400 border-t pt-4">
                    <p>{formData.footer_note}</p>
                    <a
                      href={formData.complaint_link}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                    >
                      Contact us or submit a complaint
                    </a>
                  </div>
                )}
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create Poll</h1>
            <p className="text-slate-600 dark:text-slate-400">Create a new poll for your community</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center space-x-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Poll'}</span>
            </button>
          </div>
        </div>

        <div className={`grid grid-cols-1 ${showPreview ? 'lg:grid-cols-2' : ''} gap-8`}>
          {/* Form Section */}
          <div className="space-y-6">
            {/* Poll Settings */}
            <div className={`rounded-xl border p-6 ${isDark ? 'border-slate-600 bg-slate-800/50' : 'border-slate-200 bg-white'}`}>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Poll Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                    placeholder="Enter poll title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                    placeholder="Enter poll description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Deadline</label>
                  <input
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={formData.is_anonymous}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_anonymous: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="anonymous" className="text-sm text-slate-700 dark:text-slate-300">
                    Anonymous poll
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Footer Note</label>
                  <textarea
                    value={formData.footer_note}
                    onChange={(e) => setFormData(prev => ({ ...prev, footer_note: e.target.value }))}
                    rows={2}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                    placeholder="Footer note for the poll"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Complaint Link</label>
                  <input
                    type="text"
                    value={formData.complaint_link}
                    onChange={(e) => setFormData(prev => ({ ...prev, complaint_link: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                    placeholder="/main/complaints"
                  />
                </div>
              </div>
            </div>

            {/* Questions Section */}
            <div className={`rounded-xl border p-6 ${isDark ? 'border-slate-600 bg-slate-800/50' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Questions</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => addQuestion('radio')}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Question</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {formData.questions.map((question, index) => renderQuestionEditor(question, index))}

                {formData.questions.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">No questions added yet. Click "Add Question" to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="lg:col-span-1">
              {renderPreview()}
            </div>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  )
}
