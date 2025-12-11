//components/Hero.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from './ThemeContext'
import { Button } from './Button'
import Image from 'next/image'

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

  const headline = "Smarter way for communities to connect and engage."

  return (
    <section className={`relative overflow-hidden min-h-screen flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-black via-slate-900 to-slate-900' : 'bg-gradient-to-br from-white via-slate-50 to-slate-100'}`}>
      {/* Animated Circular Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className={`absolute -top-1/2 -left-1/4 w-96 h-96 ${isDark ? 'bg-slate-500/10' : 'bg-slate-500/20'} rounded-full blur-3xl`}
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className={`absolute -bottom-1/2 -right-1/4 w-96 h-96 ${isDark ? 'bg-slate-500/10' : 'bg-slate-500/20'} rounded-full blur-3xl`}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-32 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-slate-500/10 to-slate-500/10 border border-slate-500/20 mb-8"
          >

            <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              ✨ Engange with your community online!
            </span>
          </motion.div>

          <motion.h1
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className={`text-5xl md:text-7xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}
          >
            {headline.split('').map((char, index) => (
              <motion.span
                key={index}
                variants={letterVariants}
                transition={{ duration: 0.3, type: 'spring', stiffness: 100 }}
                className={char === '.' ? `bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent` : ''}
              >
                {char}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className={`text-xl md:text-2xl mb-12 max-w-3xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
          >
            Create polls, resolve complaints, feedback, chat, engage — all in one secure platform designed for modern communities.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)' }}
              whileTap={{ scale: 0.95 }}
              className={`px-8 py-4 text-base font-medium text-white rounded-xl ${isDark ? 'bg-gradient-to-r from-slate-600 to-slate-800' : 'bg-gradient-to-r from-slate-600 to-slate-800'} shadow-lg`}
            >
              Get Started →
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-8 py-4 text-base font-medium rounded-xl ${isDark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white text-slate-900 hover:bg-slate-50'} border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}
            >
              ▶ Try Demo
            </motion.button>
          </motion.div>

          {/* Dashboard Preview with Image and Fade Bottom */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-16 relative"
          >
            <div className={`relative rounded-2xl overflow-hidden shadow-2xl border ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'} p-4`}>
              {/* Browser Chrome */}
              <div className={`flex items-center gap-2 mb-4 pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className={`flex-1 mx-4 px-3 py-1 text-xs rounded ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                  app.ecommunity.com/dashboard
                </div>
              </div>

              {/* Dashboard Image with Fade Bottom */}
              <div className="relative">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="relative overflow-hidden rounded-xl"
                >
                  <video
                    src="/hero section vid/ECOM vid.mp4"
                    alt="E-Community Dashboard Preview"
                    className="w-full h-auto object-cover"
                    loop
                    muted
                    autoPlay
                    playsInline
                  />
                  {/* Fade Bottom Effect */}
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-900 dark:via-slate-900/80 dark:to-transparent"></div>
                </motion.div>

                {/* Floating Stats */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.0 }}
                  className={`absolute -left-4 top-1/4 hidden lg:block p-4 rounded-xl ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border shadow-xl`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Verified</div>
                      <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Contact updated</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1 }}
                  className={`absolute -right-4 top-1/3 hidden lg:block p-4 rounded-xl ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border shadow-xl`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>+125 Leads</div>
                      <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>This month</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-16 flex flex-wrap justify-center items-center gap-8 opacity-60"
          >
            {['BlackRock', 'Celanese', 'DISCOVER', 'biotechne'].map((company, index) => (
              <motion.div
                key={company}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + index * 0.1 }}
                className={`text-lg font-semibold ${isDark ? 'text-slate-600' : 'text-slate-400'}`}
              >
                {company}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
