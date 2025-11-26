'use client'

import { motion, useMotionValue, useTransform, useScroll, AnimatePresence } from 'framer-motion'
import { useTheme } from './ThemeContext'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'

const features = [
  {
    id: 1,
    title: 'Smart Community Management',
    subtitle: 'Streamline operations with AI-powered insights',
    description: 'Our intelligent platform analyzes community data to provide actionable insights, automate routine tasks, and help leaders make data-driven decisions that benefit everyone.',
    highlights: ['AI-powered analytics', 'Automated workflows', 'Real-time insights'],
    image: '/images/smart-management.jpg',
    color: 'from-slate-400 to-slate-600',
    icon: '🤖'
  },
  {
    id: 2,
    title: 'Unified Communication Hub',
    subtitle: 'Connect all community members in one place',
    description: 'Break down communication barriers with our integrated messaging system. From announcements to private conversations, keep everyone informed and engaged.',
    highlights: ['Group messaging', 'Private conversations', 'Announcement system'],
    image: '/images/communication.jpg',
    color: 'from-gray-400 to-gray-600',
    icon: '💬'
  },
  {
    id: 3,
    title: 'Interactive Polling & Feedback',
    subtitle: 'Make democracy accessible to all',
    description: 'Empower community members to have their voices heard through interactive polls, surveys, and feedback systems that drive meaningful change.',
    highlights: ['Real-time polling', 'Survey creation', 'Feedback tracking'],
    image: '/images/polling.jpg',
    color: 'from-neutral-400 to-neutral-600',
    icon: '📊'
  },
  {
    id: 4,
    title: 'Advanced Security & Privacy',
    subtitle: 'Your data is protected with enterprise-grade security',
    description: 'Rest assured with our comprehensive security measures, including end-to-end encryption, role-based access control, and transparent data handling practices.',
    highlights: ['End-to-end encryption', 'Role-based access', 'GDPR compliant'],
    image: '/images/security.jpg',
    color: 'from-stone-400 to-stone-600',
    icon: '🔒'
  }
]

export default function FeatureGrid() {
  const { isDark } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentFeature, setCurrentFeature] = useState(0)

  // Scroll-based animation setup - span full container height
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Calculate transition points with much longer hold on each feature
  const featureIndex = useTransform(
    scrollYProgress,
    [0, 0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 1],  // Much slower transitions
    [0, 0, 0, 1, 1, 2, 2, 3, 3, 3, 3],  // Hold each feature much longer, last one until end
    {
      clamp: true,
    }
  )

  // Update current feature based on scroll
  useEffect(() => {
    const unsubscribe = featureIndex.onChange((value) => {
      const clampedValue = Math.min(
        Math.max(Math.round(value), 0),
        features.length - 1
      )
      setCurrentFeature(clampedValue)
    })
    return unsubscribe
  }, [featureIndex])

  // Smooth text transitions
  const textVariants = {
    enter: {
      opacity: 0,
      x: -50,
      transition: { duration: 0.5, ease: "easeOut" }
    },
    center: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    },
    exit: {
      opacity: 0,
      x: 50,
      transition: { duration: 0.5, ease: "easeIn" }
    }
  }

  // Smooth image transitions
  const imageVariants = {
    enter: {
      opacity: 0,
      scale: 1.1,
      transition: { duration: 0.7, ease: "easeOut" }
    },
    center: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.7, ease: "easeOut" }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: { duration: 0.7, ease: "easeIn" }
    }
  }

  return (
    <section className={`relative overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-white/50'}`}>

      {/* Dynamic Backgrounds */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          x: [0, 40, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`absolute top-10 left-8 w-72 h-72 ${isDark ? 'bg-gradient-to-br from-slate-600/10 to-slate-400/10' : 'bg-gradient-to-br from-slate-400/20 to-slate-600/20'} rounded-full blur-3xl`}
      />
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          x: [0, -40, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`absolute bottom-10 right-8 w-64 h-64 ${isDark ? 'bg-gradient-to-br from-slate-600/10 to-slate-400/10' : 'bg-gradient-to-br from-slate-400/20 to-slate-600/20'} rounded-full blur-3xl`}
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`absolute top-20 left-10 w-96 h-96 ${isDark ? 'bg-gradient-to-br from-blue-500/5 to-purple-500/5' : 'bg-gradient-to-br from-blue-500/10 to-purple-500/10'} rounded-full blur-3xl`}
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -80, 0],
          y: [0, 60, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={`absolute bottom-20 right-10 w-80 h-80 ${isDark ? 'bg-gradient-to-br from-purple-500/5 to-pink-500/5' : 'bg-gradient-to-br from-purple-500/10 to-pink-500/10'} rounded-full blur-3xl`}
      />

      {/* Header Intro Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center mb-6 py-16 px-6"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-block mb-8"
        >
          <div className={`px-6 py-3 rounded-full ${isDark ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-sm border ${isDark ? 'border-slate-700' : 'border-slate-200'} shadow-lg`}>
            <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Powerful Features</span>
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className={`text-4xl md:text-5xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} mb-4`}
        >
          Experience the Future of
          <span className={`bg-gradient-to-r from-slate-600 to-slate-800 ${isDark ? 'dark:from-slate-300 dark:to-slate-100' : ''} bg-clip-text text-transparent`}> Community Management</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className={`text-xl ${isDark ? 'text-slate-400' : 'text-slate-600'} max-w-3xl mx-auto`}
        >
          Scroll through our innovative features that are revolutionizing how communities connect, collaborate, and thrive together.
        </motion.p>
      </motion.div>

      {/* Sticky Scrollytelling Section */}
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ height: `${features.length * 100}vh` }}
      >
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
          {/* Feature Grid Content */}
          <div className="relative z-10 h-full w-full flex items-center">
            <div className="w-full max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

                {/* Text Content */}
                <div className="space-y-8 order-2 lg:order-1">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentFeature}
                      variants={textVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="space-y-6"
                    >
                      {/* Feature Icon */}
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-600 shadow-lg`}
                      >
                        <span className="text-3xl">{features[currentFeature]?.icon}</span>
                      </motion.div>

                      {/* Feature Title */}
                      <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className={`text-2xl md:text-3xl lg:text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}
                      >
                        {features[currentFeature]?.title}
                      </motion.h3>

                      {/* Feature Subtitle */}
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className={`text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'} font-medium`}
                      >
                        {features[currentFeature]?.subtitle}
                      </motion.p>

                      {/* Feature Description */}
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className={`text-base md:text-lg leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
                      >
                        {features[currentFeature]?.description}
                      </motion.p>

                      {/* Feature Highlights */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex flex-wrap gap-3"
                      >
                        {features[currentFeature]?.highlights.map((highlight, index) => (
                          <motion.span
                            key={highlight}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.7 + index * 0.1 }}
                            className={`px-3 md:px-4 py-2 rounded-full text-sm font-medium ${isDark ? 'bg-slate-800/50 text-slate-300 border border-slate-700' : 'bg-white/50 text-slate-700 border border-slate-200'} backdrop-blur-sm`}
                          >
                            {highlight}
                          </motion.span>
                        ))}
                      </motion.div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Visual Content */}
                <div className="relative order-1 lg:order-2">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentFeature}
                      variants={imageVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl"
                    >
                      <Image
                        src={features[currentFeature]?.image}
                        alt={features[currentFeature]?.title}
                        fill
                        className="object-cover"
                      />

                      {/* Gradient Overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br from-slate-400 to-slate-600 opacity-20`}></div>

                      {/* Floating Elements */}
                      <motion.div
                        animate={{
                          y: [0, -10, 0],
                          rotate: [0, 5, 0]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className={`absolute top-6 right-6 w-12 h-12 rounded-full ${isDark ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-sm flex items-center justify-center shadow-lg`}
                      >
                        <span className="text-xl">{features[currentFeature]?.icon}</span>
                      </motion.div>

                      {/* Feature Number */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.8, type: 'spring' }}
                        className={`absolute bottom-6 left-6 w-12 h-12 rounded-full ${isDark ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-sm flex items-center justify-center shadow-lg`}
                      >
                        <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {currentFeature + 1}
                        </span>
                      </motion.div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}