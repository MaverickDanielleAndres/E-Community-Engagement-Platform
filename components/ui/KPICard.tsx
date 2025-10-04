// @/components/ui/KPICard.tsx
'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useTheme } from '@/components/ThemeContext'

interface KPICardProps {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ElementType
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo'
  onClick?: () => void
}

export function KPICard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color = 'blue',
  onClick
}: KPICardProps) {
  const { isDark } = useTheme()

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600'
  }

  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-slate-600 dark:text-slate-400'
  }

  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : null

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl p-6 shadow-lg border group transition-all duration-300
        ${onClick ? 'cursor-pointer' : ''}
        ${isDark ? 'bg-slate-800 border-slate-700 hover:shadow-2xl hover:shadow-blue-500/10 text-white' : 'bg-white border-slate-200 hover:shadow-2xl hover:shadow-blue-500/10 text-black'}
      `}
    >
      {/* Background Gradient */}
      <div className={`
        absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity duration-300
        ${colorClasses[color]}
      `} />
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-slate-600'}`}>
            {title}
          </p>
          <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {value}
          </p>
          {change && (
            <div className="flex items-center mt-3">
              {TrendIcon && (
                <TrendIcon className={`w-4 h-4 mr-1 ${isDark ? 'text-white' : (trend ? trendColors[trend] : 'text-slate-400')}`} />
              )}
              <span className={`text-sm font-medium ${isDark ? 'text-white' : (trend ? trendColors[trend] : 'text-slate-500')}`}>
                {change}
              </span>
            </div>
          )}
        </div>
        
        {Icon && (
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`
              p-4 rounded-2xl shadow-lg bg-gradient-to-br
              ${colorClasses[color]}
            `}
          >
            <Icon className="w-6 h-6 text-white" />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
