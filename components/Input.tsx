'use client'

import { forwardRef, useState, useEffect, InputHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  isDark?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, type, className = '', isDark = false, placeholder, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue)

    // Update hasValue when props.value changes
    useEffect(() => {
      setHasValue(!!props.value)
    }, [props.value])

    const inputType = type === 'password' && showPassword ? 'text' : type
    const isFloating = isFocused || hasValue

    // Check for auto-filled values and update hasValue accordingly
    useEffect(() => {
      if (ref && 'current' in ref && ref.current) {
        const inputElement = ref.current

        const updateHasValue = () => {
          const currentValue = inputElement.value
          setHasValue(!!currentValue)
        }

        // Check immediately
        updateHasValue()

        // Set up MutationObserver to watch for value changes (auto-fill)
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
              updateHasValue()
            }
          })
        })

        observer.observe(inputElement, {
          attributes: true,
          attributeFilter: ['value']
        })

        // Listen for webkit auto-fill animation
        const handleAnimationStart = (e: AnimationEvent) => {
          if (e.animationName === 'webkit-autofill') {
            updateHasValue()
          }
        }

        // Listen for input events (covers manual input and some auto-fill cases)
        inputElement.addEventListener('input', updateHasValue)
        inputElement.addEventListener('change', updateHasValue)
        inputElement.addEventListener('animationstart', handleAnimationStart)

        // Check periodically for auto-fill (fallback for browsers that don't trigger events)
        const intervalId = setInterval(updateHasValue, 100)

        return () => {
          observer.disconnect()
          clearInterval(intervalId)
          inputElement.removeEventListener('input', updateHasValue)
          inputElement.removeEventListener('change', updateHasValue)
          inputElement.removeEventListener('animationstart', handleAnimationStart)
        }
      }
    }, [ref])

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      props.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      setHasValue(!!e.target.value)
      props.onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value)
      props.onChange?.(e)
    }

    return (
      <div className="relative w-full">
        <div className="relative">
          {label && (
            <motion.label
              initial={false}
              animate={{
                top: isFloating ? '-0.25rem' : '0.75rem',
                fontSize: isFloating ? '0.75rem' : '0.875rem',
                color: error
                  ? '#ef4444'
                  : isFocused
                  ? isDark ? '#64748b' : '#475569'
                  : isDark ? '#9ca3af' : '#6b7280'
              }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`absolute left-3 px-1 font-medium pointer-events-none origin-left z-10 ${
                isFloating
                  ? `${isDark ? 'bg-slate-800' : 'bg-white'} py-0.5`
                  : ''
              }`}
            >
              {label}
            </motion.label>
          )}

          <input
            ref={ref}
            type={inputType}
            placeholder={isFocused ? placeholder : ''}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            className={`
              w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 outline-none
              ${isDark
                ? `bg-slate-900/50 text-white placeholder-slate-500`
                : `bg-white text-slate-900 placeholder-slate-400`
              }
              ${error
                ? `border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20`
                : isFocused
                  ? isDark
                    ? `border-slate-500 ring-2 ring-slate-500/20`
                    : `border-slate-600 ring-2 ring-slate-600/20`
                  : isDark
                    ? `border-slate-700 hover:border-slate-600`
                    : `border-slate-300 hover:border-slate-400`
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
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors duration-200 ${
                isDark
                  ? `text-slate-400 hover:text-slate-300`
                  : `text-slate-500 hover:text-slate-700`
              }`}
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
            className={`mt-1.5 text-sm ${isDark ? `text-red-400` : `text-red-600`}`}
          >
            {error}
          </motion.p>
        )}

        {helperText && !error && (
          <p className={`mt-1.5 text-sm ${isDark ? `text-slate-400` : `text-slate-500`}`}>
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
