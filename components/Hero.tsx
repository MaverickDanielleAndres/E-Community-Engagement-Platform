//components/Hero.tsx
'use client'

import { motion } from 'framer-motion'
import { useTheme } from './ThemeContext'
import { Button } from './Button'

export default function Hero() {
  const { themeClasses, isDark } = useTheme()
  
  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  const staggerContainer = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.02
      }
    }
  }

  const headline = "Connect. Engage. Empower your community."
  
  return (
    <section className={`relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-black via-slate-900 to-slate-900' : 'bg-gradient-to-br from-white via-slate-50 to-slate-100'}`}>
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <motion.h1
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className={`text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'} sm:text-5xl lg:text-6xl mb-6`}
            >
              {headline.split('').map((char, index) => (
                <motion.span
                  key={index}
                  variants={letterVariants}
                  transition={{ duration: 0.3, type: 'spring', stiffness: 100 }}
                  className={char === '.' ? `bg-gradient-to-r ${themeClasses.gradient} bg-clip-text text-transparent` : ''}
                >
                  {char}
                </motion.span>
              ))}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className={`mt-6 text-lg leading-8 ${isDark ? 'text-white/80' : 'text-black/80'} max-w-2xl`}
            >
              Create polls, resolve complaints, and measure satisfaction — all in one secure platform designed for modern communities.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <Button variant="primary" size="lg" href="/signup">
                Get Started (Free)
              </Button>
              <Button variant="ghost" size="lg" href="#features">
                See Demo
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-12 flex flex-col sm:flex-row items-center gap-6 text-sm text-black/60 dark:text-white/60 justify-center lg:justify-start"
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 ${isDark ? 'bg-slate-400' : 'bg-slate-500'} rounded-full`}></div>
                <span className={isDark ? 'text-white' : 'text-black'}>Secure & Private</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 ${isDark ? 'bg-slate-400' : 'bg-slate-500'} rounded-full`}></div>
                <span className={isDark ? 'text-white' : 'text-black'}>Easy Setup</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 ${isDark ? 'bg-slate-400' : 'bg-slate-500'} rounded-full`}></div>
                <span className={isDark ? 'text-white' : 'text-black'}>24/7 Support</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <motion.div
              whileHover={{ 
                scale: 1.02,
                rotateY: 5,
                rotateX: 2
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative aspect-[4/3] lg:aspect-square"
            >
              <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-slate-800/20 to-slate-900/20' : 'bg-gradient-to-br from-slate-400/10 to-slate-500/10'} rounded-3xl blur-3xl`}></div>
              <div className={`relative ${isDark ? 'bg-slate-900/50' : 'bg-white/50'} backdrop-blur-sm rounded-3xl p-8 border ${isDark ? 'border-slate-800/50' : 'border-white/50'} shadow-xl`}>
                <div className="grid grid-cols-1 gap-6">
                  {/* Mock Dashboard Elements */}
                  <div className={`bg-gradient-to-r ${isDark ? 'from-slate-800/30 to-slate-900/30' : 'from-slate-200/30 to-slate-300/30'} rounded-2xl p-4 border ${isDark ? 'border-slate-700/50' : 'border-slate-200/50'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-3 h-3 ${isDark ? 'bg-slate-500' : 'bg-slate-600'} rounded-full`}></div>
                      <div className={`h-4 ${isDark ? 'bg-gradient-to-r from-slate-600 to-transparent' : 'bg-gradient-to-r from-slate-500 to-transparent'} rounded w-24`}></div>
                    </div>
                    <div className="space-y-2">
                      <div className={`h-2 ${isDark ? 'bg-slate-700' : 'bg-slate-200'} rounded w-full`}></div>
                      <div className={`h-2 ${isDark ? 'bg-slate-700' : 'bg-slate-200'} rounded w-3/4`}></div>
                    </div>
                  </div>
                  
                  <div className={`bg-gradient-to-r ${isDark ? 'from-slate-700/30 to-slate-800/30' : 'from-slate-300/30 to-slate-400/30'} rounded-2xl p-4 border ${isDark ? 'border-slate-600/50' : 'border-slate-300/50'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-3 h-3 ${isDark ? 'bg-slate-600' : 'bg-slate-500'} rounded-full`}></div>
                      <div className={`h-4 ${isDark ? 'bg-gradient-to-r from-slate-500 to-transparent' : 'bg-gradient-to-r from-slate-400 to-transparent'} rounded w-32`}></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className={`h-8 ${isDark ? 'bg-slate-800' : 'bg-slate-200'} rounded`}></div>
                      <div className={`h-8 ${isDark ? 'bg-slate-800' : 'bg-slate-200'} rounded`}></div>
                      <div className={`h-8 ${isDark ? 'bg-slate-800' : 'bg-slate-200'} rounded`}></div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className={`flex-1 ${isDark ? 'bg-slate-900/30' : 'bg-white/30'} rounded-xl p-3 border ${isDark ? 'border-slate-800/30' : 'border-white/30'}`}>
                      <div className={`w-6 h-6 ${isDark ? 'bg-gradient-to-br from-slate-700 to-slate-800' : 'bg-gradient-to-br from-slate-400 to-slate-500'} rounded-lg mb-2`}></div>
                      <div className={`h-2 ${isDark ? 'bg-slate-700' : 'bg-slate-300'} rounded w-full mb-1`}></div>
                      <div className={`h-2 ${isDark ? 'bg-slate-700' : 'bg-slate-300'} rounded w-2/3`}></div>
                    </div>
                    <div className={`flex-1 ${isDark ? 'bg-slate-900/30' : 'bg-white/30'} rounded-xl p-3 border ${isDark ? 'border-slate-800/30' : 'border-white/30'}`}>
                      <div className={`w-6 h-6 ${isDark ? 'bg-gradient-to-br from-slate-600 to-slate-700' : 'bg-gradient-to-br from-slate-500 to-slate-600'} rounded-lg mb-2`}></div>
                      <div className={`h-2 ${isDark ? 'bg-slate-700' : 'bg-slate-300'} rounded w-full mb-1`}></div>
                      <div className={`h-2 ${isDark ? 'bg-slate-700' : 'bg-slate-300'} rounded w-3/4`}></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
      z
      {/* Background Decorations */}
      <div className={`absolute -top-24 -right-24 w-96 h-96 ${isDark ? 'bg-gradient-to-br from-slate-800/10 to-slate-900/10' : 'bg-gradient-to-br from-slate-400/10 to-slate-500/10'} rounded-full blur-3xl`}></div>
      <div className={`absolute -bottom-24 -left-24 w-96 h-96 ${isDark ? 'bg-gradient-to-tr from-slate-900/10 to-slate-800/10' : 'bg-gradient-to-tr from-slate-500/10 to-slate-400/10'} rounded-full blur-3xl`}></div>
    </section>
  )
}