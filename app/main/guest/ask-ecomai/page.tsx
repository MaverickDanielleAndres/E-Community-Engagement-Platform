// @/app/main/guest/ask-ecomai/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/components/ThemeContext'
import { Send, Bot, User, LogIn, Sparkles, MessageCircle, HelpCircle } from 'lucide-react'

type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
}

export default function GuestAskEComAI() {
  const { isDark } = useTheme()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 Hello! I\'m EComAI, your intelligent community assistant. I can help answer questions about joining the community, verification process, voting, complaints, feedback, and much more. What would you like to know?',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const suggestedQuestions = [
    'How do I join the community?',
    'What is the verification process?',
    'How does community voting work?',
    'Can I submit complaints as a guest?',
    'What services are available to members?',
    'How long does approval take?',
    'What are the benefits of membership?',
    'How do I contact administrators?'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/guest/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input.trim(),
          history: messages.slice(-5) // Send last 5 messages for context
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: data.response,
          timestamp: new Date()
        }])
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: 'Sorry, I encountered an error. Please try again or ask a different question.',
          timestamp: new Date()
        }])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: 'Network error. Please check your connection and try again.',
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
  }

  const clearChat = () => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: '👋 Hello! I\'m EComAI, your intelligent community assistant. I can help answer questions about joining the community, verification process, voting, complaints, feedback, and much more. What would you like to know?',
      timestamp: new Date()
    }])
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-blue-600" />
            Ask EComAI
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Intelligent community assistant (Guest Mode)
          </p>
        </div>
        <button
          onClick={clearChat}
          className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Clear Chat
        </button>
      </div>

      {/* Guest Access Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <LogIn className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Enhanced Guest Access
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-200">
                Full AI assistance available • Join community for personalized help and advanced features
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">AI Online</span>
          </div>
        </div>
      </div>

      {/* Suggested Questions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Popular Questions
          </h3>
          <div className="space-y-2">
            {suggestedQuestions.slice(0, 4).map((question, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedQuestion(question)}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                  isDark
                    ? 'border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400'
                }`}
              >
                <span className="text-sm">{question}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Quick Actions
          </h3>
          <div className="space-y-2">
            {suggestedQuestions.slice(4).map((question, index) => (
              <button
                key={index + 4}
                onClick={() => handleSuggestedQuestion(question)}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                  isDark
                    ? 'border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400'
                }`}
              >
                <span className="text-sm">{question}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className={`h-[500px] overflow-y-auto p-6 rounded-2xl border shadow-lg ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <div className="space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start space-x-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                }`}>
                  {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                    : isDark
                      ? 'bg-slate-700 text-white border border-slate-600'
                      : 'bg-gray-50 text-gray-900 border border-gray-200'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-60 mt-2">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                  isDark ? 'bg-slate-700 border border-slate-600' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-500">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSubmit} className="flex space-x-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask me anything about the community..."
            className={`w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-200 ${
              isDark
                ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500'
                : 'bg-white border-slate-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50`}
          />
          {input && (
            <button
              type="button"
              onClick={() => setInput('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-medium"
        >
          <Send className="w-4 h-4" />
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>EComAI can answer questions about community features, processes, and general information.</p>
        <p className="mt-1">For personalized assistance and full platform access, consider joining the community.</p>
      </div>
    </div>
  )
}
