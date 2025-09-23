
// @/app/main/guest/settings/page.tsx
'use client'

import { useState } from 'react'
import { useTheme } from '@/components/ThemeContext'
import { Settings, Moon, Sun } from 'lucide-react'

export default function GuestSettings() {
  const { isDark, toggleTheme } = useTheme()
  const [preferences, setPreferences] = useState({
    language: 'en',
    notifications: false
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Guest Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Customize your browsing experience</p>
      </div>

      {/* Theme Settings */}
      <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center mb-4">
          <Settings className="w-5 h-5 text-blue-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Theme</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark mode</p>
          </div>
          <button
            onClick={toggleTheme}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isDark 
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            <span className="text-sm">{isDark ? 'Dark' : 'Light'}</span>
          </button>
        </div>
      </div>

      {/* Language Settings */}
      <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Language</h2>
        <select
          value={preferences.language}
          onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
          className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-300'}`}
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
        </select>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Join the community to access more personalization options
        </p>
      </div>
    </div>
  )
}