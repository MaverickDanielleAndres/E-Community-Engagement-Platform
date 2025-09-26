// @/app/main/user/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTheme } from '@/components/ThemeContext'
import { Save, User, Bell, Shield, Users } from 'lucide-react'

interface CommunityInfo {
  name: string
  memberCount: number
  createdAt: string
}

export default function UserSettings() {
  const { data: session } = useSession()
  const { isDark } = useTheme()
  const [settings, setSettings] = useState({
    name: '',
    email: '',
    notifications: {
      email: true,
      push: true,
      digest: false
    },
    privacy: {
      profileVisible: true,
      activityVisible: false
    }
  })
  const [community, setCommunity] = useState<CommunityInfo | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
  }, [session])

  const fetchUserData = async () => {
    if (!session?.user) return

    try {
      // Fetch user profile
      setSettings(prev => ({
        ...prev,
        name: session.user.name || '',
        email: session.user.email || ''
      }))

      // Fetch community info
      const communityResponse = await fetch('/api/user/community')
      if (communityResponse.ok) {
        const communityData = await communityResponse.json()
        setCommunity(communityData)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save profile settings
      const response = await fetch('/api/me/summary', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: settings.name,
          notifications: settings.notifications,
          privacy: settings.privacy
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account preferences</p>
      </div>

      {/* Community Info */}
      {community && (
        <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center mb-4">
            <Users className="w-5 h-5 text-green-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Community</h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Community Name</span>
              <span className="text-sm text-gray-900 dark:text-white">{community.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Members</span>
              <span className="text-sm text-gray-900 dark:text-white">{community.memberCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Joined</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {new Date(community.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Profile Settings */}
      <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center mb-4">
          <User className="w-5 h-5 text-blue-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-300'}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={settings.email}
              disabled
              className={`w-full px-3 py-2 rounded-lg border opacity-50 ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-300'}`}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center mb-4">
          <Bell className="w-5 h-5 text-yellow-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
        </div>

        <div className="space-y-4">
          {Object.entries(settings.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, [key]: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Settings */}
      <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center mb-4">
          <Shield className="w-5 h-5 text-purple-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy</h2>
        </div>

        <div className="space-y-4">
          {Object.entries(settings.privacy).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setSettings({
                    ...settings,
                    privacy: { ...settings.privacy, [key]: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}
