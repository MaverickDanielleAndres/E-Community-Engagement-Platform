// @/components/ui/ChartCard.tsx
import React from 'react'
import { useTheme } from '@/components/ThemeContext'

interface ChartCardProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function ChartCard({ title, children, className = '' }: ChartCardProps) {
  const { isDark } = useTheme()

  return (
    <div className={`
      bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700
      shadow-sm hover:shadow-md transition-shadow duration-200 p-6 ${className}
    `}>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        {title}
      </h3>
      <div className="w-full">
        {children}
      </div>
    </div>
  )
}
