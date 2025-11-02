'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2 } from 'lucide-react'

interface GifData {
  id: string
  title: string
  url: string
  preview: string
  width: number
  height: number
}

interface GifPickerProps {
  onSelectGif: (gif: GifData) => void
  onClose: () => void
}

export function GifPicker({ onSelectGif, onClose }: GifPickerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [gifs, setGifs] = useState<GifData[]>([])
  const [loading, setLoading] = useState(false)
  const [trendingGifs, setTrendingGifs] = useState<GifData[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Load trending GIFs on mount
  useEffect(() => {
    loadTrendingGifs()
    searchInputRef.current?.focus()
  }, [])

  const loadTrendingGifs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/messaging/gifs/trending')
      if (response.ok) {
        const data = await response.json()
        setTrendingGifs(data.gifs || [])
        if (!searchTerm) {
          setGifs(data.gifs || [])
        }
      }
    } catch (error) {
      console.error('Error loading trending GIFs:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchGifs = async (query: string) => {
    if (!query.trim()) {
      setGifs(trendingGifs)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/messaging/gifs/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setGifs(data.gifs || [])
      }
    } catch (error) {
      console.error('Error searching GIFs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchGifs(value)
    }, 300)
    return () => clearTimeout(timeoutId)
  }

  const handleGifClick = (gif: GifData) => {
    onSelectGif(gif)
    onClose()
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 w-96 max-h-96 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Choose a GIF
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search GIFs..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* GIF Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : gifs.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => handleGifClick(gif)}
                className="aspect-square overflow-hidden rounded-lg hover:ring-2 hover:ring-blue-500 transition-all group"
              >
                <img
                  src={gif.preview}
                  alt={gif.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            {searchTerm ? 'No GIFs found' : 'No trending GIFs available'}
          </div>
        )}
      </div>
    </div>
  )
}
