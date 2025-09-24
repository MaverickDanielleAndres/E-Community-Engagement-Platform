// app/main/admin/settings/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/components/ThemeContext'
import { Save, Settings, Shield, Bell, Bot, Upload, Check } from 'lucide-react'

interface CommunitySettings {
  name: string
  description: string
  code: string
  logo_url: string
  allow_guest_access: boolean
  require_approval: boolean
  auto_archive_polls: boolean
  enable_ai_insights: boolean
  notification_settings: {
    email_notifications: boolean
    push_notifications: boolean
    daily_digest: boolean
    weekly_summary: boolean
  }
  ai_settings: {
    sentiment_analysis: boolean
    anomaly_detection: boolean
    auto_categorization: boolean
    chatbot_enabled: boolean
  }
}

export default function AdminSettings() {
  const { isDark } = useTheme()
  const [settings, setSettings] = useState<CommunitySettings>({
    name: '',
    description: '',
    code: '',
    logo_url: '',
    allow_guest_access: true,
    require_approval: false,
    auto_archive_polls: true,
    enable_ai_insights: true,
    notification_settings: {
      email_notifications: true,
      push_notifications: true,
      daily_digest: false,
      weekly_summary: true
    },
    ai_settings: {
      sentiment_analysis: true,
      anomaly_detection: true,
      auto_categorization: true,
      chatbot_enabled: true
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Mock data - replace with actual API call
        const mockSettings: CommunitySettings = {
          name: 'Palatiw Barangay',
          description: 'A vibrant community focused on collaboration and engagement.',
          code: 'PALATIW-001',
          logo_url: '',
          allow_guest_access: true,
          require_approval: false,
          auto_archive_polls: true,
          enable_ai_insights: true,
          notification_settings: {
            email_notifications: true,
            push_notifications: true,
            daily_digest: false,
            weekly_summary: true
          },
          ai_settings: {
            sentiment_analysis: true,
            anomaly_detection: true,
            auto_categorization: true,
            chatbot_enabled: true
          }
        }
        setSettings(mockSettings)
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      // API call to save settings
      console.log('Saving settings:', settings)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Handle image upload logic here
    console.log('Uploading image:', file)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Community Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure your community preferences and features
          </p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : saved ? (
            <Check className="w-4 h-4 mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Basic Information */}
      <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center mb-4">
          <Settings className="w-5 h-5 text-blue-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Basic Information
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Community Name
            </label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              className={`
                w-full px-3 py-2 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
                ${isDark 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-slate-300 text-gray-900'
                }
              `}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Community Code
            </label>
            <input
              type="text"
              value={settings.code}
              onChange={(e) => setSettings({ ...settings, code: e.target.value })}
              className={`
                w-full px-3 py-2 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
                ${isDark 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-slate-300 text-gray-900'
                }
              `}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              value={settings.description}
              onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              className={`
                w-full px-3 py-2 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
                ${isDark 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-slate-300 text-gray-900'
                }
              `}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Community Logo
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-slate-700 flex items-center justify-center">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt="Community Logo" className="w-full h-full rounded-lg object-cover" />
                ) : (
                  <Upload className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Logo
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Access Control */}
      <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center mb-4">
          <Shield className="w-5 h-5 text-green-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Access Control
          </h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Allow Guest Access</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Let guests view public content without joining</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allow_guest_access}
                onChange={(e) => setSettings({ ...settings, allow_guest_access: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Require Approval</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">New members need admin approval to join</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.require_approval}
                onChange={(e) => setSettings({ ...settings, require_approval: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Auto-Archive Polls</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Automatically archive polls after deadline</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.auto_archive_polls}
                onChange={(e) => setSettings({ ...settings, auto_archive_polls: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center mb-4">
          <Bell className="w-5 h-5 text-yellow-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Notification Settings
          </h2>
        </div>
        
        <div className="space-y-4">
          {Object.entries(settings.notification_settings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {key.replace('_', ' ')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {key === 'email_notifications' && 'Send notifications via email'}
                  {key === 'push_notifications' && 'Browser push notifications'}
                  {key === 'daily_digest' && 'Daily summary of community activity'}
                  {key === 'weekly_summary' && 'Weekly community report'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setSettings({
                    ...settings,
                    notification_settings: {
                      ...settings.notification_settings,
                      [key]: e.target.checked
                    }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* AI Settings */}
      <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center mb-4">
          <Bot className="w-5 h-5 text-purple-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Features
          </h2>
        </div>
        
        <div className="space-y-4">
          {Object.entries(settings.ai_settings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {key.replace('_', ' ')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {key === 'sentiment_analysis' && 'Analyze sentiment in feedback and complaints'}
                  {key === 'anomaly_detection' && 'Detect unusual patterns in community activity'}
                  {key === 'auto_categorization' && 'Automatically categorize complaints and feedback'}
                  {key === 'chatbot_enabled' && 'Enable AI chatbot for community support'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setSettings({
                    ...settings,
                    ai_settings: {
                      ...settings.ai_settings,
                      [key]: e.target.checked
                    }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}