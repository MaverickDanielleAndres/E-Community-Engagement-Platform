// @/app/main/user/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTheme } from '@/components/ThemeContext'
import { Save, User, Bell, Shield, Users, Camera } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { Toast } from '@/components/Toast'

interface CommunityInfo {
  name: string
  memberCount: number
  createdAt: string
}

export default function UserSettings() {
  const { data: session, update: sessionUpdate } = useSession()
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
  const [profileImage, setProfileImage] = useState('')
  const [community, setCommunity] = useState<CommunityInfo | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null)

  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchUserData()
  }, [session])

  const fetchUserData = async () => {
    if (!session?.user) return

    try {
      // Fetch user summary with settings
      const summaryResponse = await fetch('/api/me/summary')
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json()
        setSettings({
          name: summaryData.user.name || '',
          email: summaryData.user.email || '',
          notifications: summaryData.settings.notifications,
          privacy: summaryData.settings.privacy
        })
        setProfileImage(summaryData.settings.image || '')
      }

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

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/me/summary', {
        method: 'PATCH',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to upload image')
      }

      const result = await response.json()
      setProfileImage(result.imageUrl)
      setToast({ message: 'Profile image uploaded successfully!', type: 'success' })
    } catch (error: any) {
      console.error('Error uploading image:', error)
      setToast({ message: `Upload failed: ${error.message}`, type: 'error' })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save profile settings (non-image)
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
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save settings')
      }

      // Update the session with new user data (image is no longer stored in session)
      await sessionUpdate({
        name: settings.name
      })

      setToast({ message: 'Settings saved successfully!', type: 'success' })
    } catch (error: any) {
      console.error('Error saving settings:', error)
      setToast({ message: `Failed to save settings: ${error.message}`, type: 'error' })
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile Picture</label>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={profileImage || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIyNCIgcj0iOCIgZmlsbD0iI2U1ZTdlYiIvPgo8cGF0aCBkPSJNMjQgNDAgUTMyIDQ4IDQwIDQwIiBzdHJva2U9IiM2YjcyODAiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMiIgZmlsbD0iI2U1ZTdlYiIvPgo8L3N2Zz4K'}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                />
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full cursor-pointer hover:bg-blue-700">
                  <Camera className="w-3 h-3" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file)
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              {uploading && (
                <div className="text-sm text-gray-500 dark:text-gray-400">Uploading...</div>
              )}
            </div>
          </div>
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

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={4000}
        />
      )}
    </div>
  )
}
