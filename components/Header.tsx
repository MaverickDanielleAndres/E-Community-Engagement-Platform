// components/Header.tsx
'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from './ThemeContext'
import { ThemeToggle } from './ThemeToggle'
import Link from 'next/link'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

const navigation = [
  { name: 'About', href: '#about' },
  { name: 'Features', href: '#features' },
  { name: 'FAQ', href: '#faq' },
  { name: 'Contact', href: '#contact' },
]

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { themeClasses, isDark } = useTheme()

  return (
    <>
      <style jsx global>{`
        .header-bg { background: ${themeClasses.bg}; backdrop-filter: blur(12px); border-bottom: 1px solid ${themeClasses.border}; }
      `}</style>

      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }}
        className="sticky top-0 z-50 header-bg shadow-sm"
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${isDark ? 'bg-gradient-to-r from-slate-700 to-slate-900' : 'bg-gradient-primary'} rounded-lg flex items-center justify-center`}>
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <span className={`font-bold text-xl bg-gradient-to-r ${themeClasses.gradient} bg-clip-text text-transparent`}>
                  E-Community
                </span>
              </div>
            </Link>
          </div>
          
          <button
            className={`lg:hidden -m-2.5 inline-flex items-center justify-center rounded-md p-2.5 ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'} transition-colors duration-200`}
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          
          <div className="hidden lg:flex lg:gap-x-12">
            {navigation.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1, transition: { duration: 0.5, delay: index * 0.1, ease: "easeOut" } }}
              >
                <Link
                  href={item.href}
                  className={`text-sm font-semibold leading-6 ${isDark ? 'text-slate-300 hover:text-slate-100' : 'text-slate-700 hover:text-slate-900'} transition-colors duration-200 relative group`}
                >
                  {item.name}
                  <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${themeClasses.underline}`} />
                </Link>
              </motion.div>
            ))}
          </div>
          
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:space-x-4">
            <ThemeToggle />
            {/* FIX: Updated login/signup routes */}
            <Link
              href="/auth/login"
              className={`text-sm font-semibold leading-6 ${isDark ? 'text-slate-300 hover:text-slate-100' : 'text-slate-700 hover:text-slate-900'} transition-colors duration-200`}
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className={`px-6 py-3 text-base rounded-xl text-white font-medium transition-all duration-200 bg-gradient-to-r ${themeClasses.btnGradient.split(' ').slice(0,4).join(' ')}`}>
              Sign up
            </Link>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`fixed inset-y-0 right-0 z-50 w-full overflow-y-auto px-6 py-6 sm:max-w-sm lg:hidden ${isDark ? 'bg-slate-900' : 'bg-white'}`}
            >
              <div className="flex items-center justify-between">
                <Link href="/" className="-m-1.5 p-1.5">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${isDark ? 'bg-gradient-to-r from-slate-700 to-slate-900' : 'bg-gradient-primary'} rounded-lg flex items-center justify-center`}>
                      <span className="text-white font-bold text-lg">E</span>
                    </div>
                    <span className={`font-bold text-xl bg-gradient-to-r ${themeClasses.gradient} bg-clip-text text-transparent`}>
                      E-Community
                    </span>
                  </div>
                </Link>
                <button
                  className={`-m-2.5 rounded-md p-2.5 ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'} transition-colors duration-200`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close menu</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              
              <div className="mt-6 flow-root">
                <div className={`-my-6 ${isDark ? 'divide-slate-700' : 'divide-slate-200'} divide-y`}>
                  <div className="space-y-2 py-6">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'} transition-colors duration-200`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                  
                  <div className="py-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Theme</span>
                      <ThemeToggle />
                    </div>
                    
                    {/* FIX: Updated mobile login/signup routes */}
                    <Link
                      href="/auth/login"
                      className={`block rounded-lg px-3 py-2 text-base font-semibold leading-7 ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'} transition-colors duration-200`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log in
                    </Link>
                    
                    <Link
                      href="/auth/signup"
                      className={`block text-center rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white transition-all duration-200 bg-gradient-to-r ${themeClasses.btnGradient.split(' ').slice(0,4).join(' ')}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign up
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}