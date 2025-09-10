'use client'

import { createContext, useContext, useState, useEffect } from 'react'

interface ThemeContextType {
  isDark: boolean
  toggleTheme: () => void
  themeClasses: {
    bg: string
    border: string
    text: string
    textPrimary: string
    hover: string
    gradient: string
    btnGradient: string
    divide: string
    mobileBg: string
    underline: string
  }
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function CustomThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = saved === 'dark' || (!saved && prefersDark)
    
    setIsDark(dark)
    applyTheme(dark)
  }, [])

  const applyTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark')
      document.body.style.cssText = 'background:#000000;color:#ffffff;transition:all 0.3s'
    } else {
      document.documentElement.classList.remove('dark')
      document.body.style.cssText = 'background:#ffffff;color:#000000;transition:all 0.3s'
    }
  }

  const toggleTheme = () => {
    const newDark = !isDark
    setIsDark(newDark)
    localStorage.setItem('theme', newDark ? 'dark' : 'light')
    applyTheme(newDark)
  }

  const themeClasses = {
    bg: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
    border: isDark ? 'rgba(30,41,59,0.5)' : 'rgba(226,232,240,0.5)',
    text: isDark ? 'text-white hover:text-slate-100' : 'text-black hover:text-slate-900',
    textPrimary: isDark ? 'text-white' : 'text-black',
    hover: isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100',
    gradient: isDark ? 'from-slate-300 to-slate-100' : 'from-slate-600 to-slate-800',
    btnGradient: isDark ? 'from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-950' : 'from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950',
    divide: isDark ? 'divide-slate-800' : 'divide-slate-200',
    mobileBg: isDark ? 'bg-slate-900' : 'bg-white',
    underline: isDark ? 'bg-slate-100' : 'bg-slate-900'
  }

  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, themeClasses }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a CustomThemeProvider')
  }
  return context
}