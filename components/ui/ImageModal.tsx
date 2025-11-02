'use client'

import { useEffect, useState } from 'react'
import { X, AlertCircle } from 'lucide-react'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  alt: string
}

export function ImageModal({ isOpen, onClose, imageUrl, alt }: ImageModalProps) {
  const [imageError, setImageError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
      // Reset error state when modal opens
      setImageError(false)
      setErrorMessage('')
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Image loading error for URL:', imageUrl, 'Event:', e)
    setImageError(true)
    setErrorMessage('Failed to load image. The image may be corrupted, inaccessible, or the URL may be invalid.')
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-slate-900 bg-opacity-75 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        {imageError ? (
          <div className="bg-white rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px] max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Image Load Error</h3>
            <p className="text-gray-600 text-center mb-4">{errorMessage}</p>
            <p className="text-sm text-gray-500 text-center">URL: {imageUrl}</p>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={alt}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
            onError={handleImageError}
          />
        )}
      </div>
    </div>
  )
}
