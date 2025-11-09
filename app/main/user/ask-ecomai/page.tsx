// @/app/main/user/ask-ecomai/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/components/ThemeContext'
import { Send, Bot, User, RefreshCw, Copy, Check } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function UserAskEComAI() {
  const { isDark } = useTheme()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `<div style="line-height: 1.8;">
<div style="margin-bottom: 16px;"><strong style="font-size: 1.1em; color: #2563eb;">Hi! Welcome to EComAI 👋</strong></div>

<div style="margin-bottom: 12px;"><strong>What I Can Help You With</strong></div>
<div style="margin-left: 20px; margin-bottom: 8px;">
   • <strong>Community Platform</strong> - Polls, complaints, feedback, messaging<br/>
   • <strong>Platform Guidance</strong> - Step-by-step help with features<br/>
   • <strong>General Questions</strong> - Any topic you'd like to explore<br/>
   • <strong>Real-time Updates</strong> - Current announcements and activities
</div>

<div style="margin-bottom: 12px;"><strong>Get Started</strong></div>
<div style="margin-left: 20px;">
   Ask me anything! I'm here to help with both community features and general knowledge
</div>
</div>`,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const faqQuestions = [
    'How do I submit a complaint?',
    'When is the next community meeting?',
    'How do I vote on polls?',
    'Who are the community administrators?',
    'How do I send messages?',
    'What is artificial intelligence?'
  ]

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input.trim(), 
          history: messages 
        })
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        const error = await response.json()
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error.error || 'Unknown error'}. Please try again.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleFAQClick = (question: string) => {
    setInput(question)
    inputRef.current?.focus()
  }

  const handleClearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m EComAI, your intelligent community assistant. How can I help you today?',
        timestamp: new Date()
      }
    ])
  }

  const handleCopyMessage = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="max-w-4xl mx-auto space-y-6 flex-1 flex flex-col w-full">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Ask EComAI
            </h1>
            <p className={`mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Powered by AI - Get help with anything
            </p>
          </div>
          <button
            onClick={handleClearChat}
            className={`px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
              isDark
                ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                : 'border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">Clear Chat</span>
          </button>
        </div>

        {/* FAQ Chips */}
        <div className="flex flex-wrap gap-2">
          {faqQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => handleFAQClick(question)}
              disabled={loading}
              className={`px-3 py-1 text-sm rounded-full border transition-colors disabled:opacity-50 ${
                isDark
                  ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {question}
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div 
          className={`flex-1 overflow-y-auto p-4 rounded-xl border ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}
        >
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-green-500 text-white'
                  }`}>
                    {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className={`px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : isDark
                          ? 'bg-slate-700 text-white'
                          : 'bg-gray-100 text-gray-900'
                    }`}>
                      {message.role === 'user' ? (
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      ) : (
                        <div 
                          className="text-sm formatted-response"
                          dangerouslySetInnerHTML={{ __html: message.content }}
                        />
                      )}
                    </div>
                    {message.role === 'assistant' && (
                      <button
                        onClick={() => handleCopyMessage(message.content, message.id)}
                        className={`self-start px-2 py-1 text-xs rounded flex items-center gap-1 ${
                          isDark
                            ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-700'
                            : 'text-slate-600 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {copiedId === message.id ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className={`px-4 py-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask me anything about the community or any topic..."
            className={`flex-1 px-4 py-3 rounded-lg border ${
              isDark
                ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                : 'bg-white border-slate-300 text-gray-900 placeholder-slate-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}