//components/Button.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  href?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
  isLoading?: boolean
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  isLoading = false
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-slate-700 to-slate-900 text-white hover:from-slate-800 hover:to-slate-950 hover:shadow-lg focus:ring-slate-500 dark:from-slate-600 dark:to-slate-800 dark:hover:from-slate-700 dark:hover:to-slate-900',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 focus:ring-slate-500',
    ghost: 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 focus:ring-slate-500',
    outline: 'border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 focus:ring-slate-500'
  }
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-2xl'
  }
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`
  
  const buttonContent = (
    <motion.span
      whileHover={{ scale: variant === 'primary' ? 1.05 : 1.02 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2"
    >
      {isLoading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </motion.span>
  )
  
  if (href) {
    return (
      <Link href={href} className={classes}>
        {buttonContent}
      </Link>
    )
  }
  
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={classes}
      whileHover={{ scale: variant === 'primary' ? 1.05 : 1.02 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {buttonContent}
    </motion.button>
  )
}