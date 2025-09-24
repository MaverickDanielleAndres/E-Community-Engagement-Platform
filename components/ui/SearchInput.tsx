
// @/components/ui/SearchInput.tsx
'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { useTheme } from '@/components/ThemeContext'

interface SearchInputProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  className?: string
}

export function SearchInput({ 
  placeholder = "Search...", 
  value = "", 
  onChange, 
  onSearch,
  className = ""
}: SearchInputProps) {
  const [searchValue, setSearchValue] = useState(value)
  const { isDark } = useTheme()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchValue(newValue)
    onChange?.(newValue)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchValue)
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        value={searchValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`
          w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all duration-200 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${isDark 
            ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500'
          }
        `}
      />
    </form>
  )
}