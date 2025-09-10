'use client'

import { forwardRef, useState, InputHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, type, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    const inputType = type === 'password' && showPassword ? 'text' : type

    return (
      <div className="relative">
        {label && (
          <motion.label
            initial={false}
            animate={{
              scale: isFocused || props.value ? 0.85 : 1,
              y: isFocused || props.value ? -24 : 0,
              color: error 
                ? '#ef4444' 
                : isFocused 
                ? '#10b981' 
                : '#6b7280'
            }}
            transition={{ duration: 0.2 }}
            className="absolute left-4 top-3 text-sm font-medium pointer-events-none origin-left"
          >
            {label}
          </motion.label>
        )}
        
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`
              input
              ${error 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                : 'focus:border-emerald-500 focus:ring-emerald-500'
              }
              ${type === 'password' ? 'pr-12' : ''}
              ${className}
            `}
            {...props}
          />
          
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200"
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </motion.p>
        )}

        {helperText && !error && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'