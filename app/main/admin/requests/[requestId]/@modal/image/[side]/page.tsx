'use client'

import { useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import { Button } from '@/components/Button'

interface ImageModalPageProps {
  params: {
    requestId: string
    side: 'front' | 'back'
  }
}

export default function ImageModalPage({ params }: ImageModalPageProps) {
  const searchParams = useSearchParams()
  const imageUrl = searchParams.get('url')

  if (!imageUrl) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md mx-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Image Not Found
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            The requested image could not be found.
          </p>
          <Button onClick={() => window.history.back()}>
            Close
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      {/* Close Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.history.back()}
        className="absolute top-4 right-4 z-10 bg-white/10 border-white/20 text-white hover:bg-white/20"
      >
        <X className="w-4 h-4" />
      </Button>

      {/* Image Container */}
      <div className="relative max-w-4xl max-h-full">
        <img
          src={imageUrl}
          alt={`${params.side} side of ID`}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          onError={(e) => {
            // Handle broken images
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            const errorDiv = target.parentElement?.querySelector('.error-message') as HTMLElement
            if (errorDiv) errorDiv.style.display = 'block'
          }}
        />

        {/* Error Message */}
        <div className="error-message hidden bg-white dark:bg-slate-800 rounded-lg p-6 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            Failed to load image. The image may be corrupted or inaccessible.
          </p>
          <Button
            onClick={() => window.history.back()}
            className="mt-4"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
