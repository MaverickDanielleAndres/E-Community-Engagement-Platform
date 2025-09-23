// @/app/main/guest/ask-ecomai/page.tsx
'use client'

import { useState } from 'react'
import { useTheme } from '@/components/ThemeContext'
import { Send, Bot, User, LogIn } from 'lucide-react'

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
      content: 'Hello! I\'m EComAI, your community assistant. As a guest, I can help answer general questions about our community. How can I help you today?',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const guestFAQ = [
    'How do I join the community?',
    'What services are available?',
    'How does community voting work?',
    'Who can I contact for support?'
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

    // Mock response for guests
    setTimeout(() => {
      const response = generateGuestResponse(input.trim())
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: response,
        timestamp: new Date()
      }])
      setLoading(false)
    }, 1000)
  }

  const generateGuestResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('join') || lowerMessage.includes('member')) {
      return "To join our community, you'll need a community access code from your local administrator. Visit the 'Join Community' section to enter your code and create an account."
    }
    
    if (lowerMessage.includes('vote') || lowerMessage.includes('poll')) {
      return "Community voting allows members to participate in important decisions. As a member, you can vote on polls, view results in real-time, and help shape community policies."
    }
    
    if (lowerMessage.includes('service') || lowerMessage.includes('feature')) {
      return "Our community platform offers voting on community issues, complaint submission and tracking, feedback collection, and community announcements. Full access requires membership."
    }
    
    return "I can help answer general questions about our community platform. For detailed assistance and full access to features, consider joining as a community member!"
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ask EComAI</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Get help with community information (Guest Mode)</p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center">
          <LogIn className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Limited Guest Access
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-200">
              Join the community for full AI assistant capabilities and personalized help
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Chips */}
      <div className="flex flex-wrap gap-2">
        {guestFAQ.map((question, index) => (
          <button
            key={index}
            onClick={() => setInput(question)}
            className={`px-3 py-1 text-sm rounded-full border transition-colors ${
              isDark 
                ? 'border-slate-600 text-slate-300 hover:bg-slate-700' 
                : 'border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {question}
          </button>
        ))}
      </div>

      {/* Chat Interface */}
      <div className={`h-96 overflow-y-auto p-4 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-green-500 text-white'
                }`}>
                  {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : isDark 
                      ? 'bg-slate-700 text-white' 
                      : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm">{message.content}</p>
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
        </div>
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Ask about community information..."
          className={`flex-1 px-4 py-2 rounded-lg border ${
            isDark 
              ? 'bg-slate-700 border-slate-600 text-white' 
              : 'bg-white border-slate-300 text-gray-900'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
