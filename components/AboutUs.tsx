//@/components/AboutUs.tsx

'use client'

import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import { useTheme } from './ThemeContext'
import { useState, useEffect } from 'react'
import Image from 'next/image'

const stats = [
  { label: 'Communities Served', value: '500+', icon: '🏘️' },
  { label: 'Active Users', value: '50K+', icon: '👥' },
  { label: 'Messages Sent', value: '2M+', icon: '💬' },
  { label: 'Polls Created', value: '10K+', icon: '📊' }
]

const values = [
  {
    title: 'Innovation First',
    description: 'We push boundaries with cutting-edge technology to solve real community challenges.',
    image: '/images/innovation.jpg',
    icon: '💡',
    color: 'from-purple-500 to-pink-500'
  },
  {
    title: 'Community Centric',
    description: 'Every decision we make puts community needs and user experience at the forefront.',
    image: '/images/community.jpg',
    icon: '❤️',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'Trust & Security',
    description: 'Your data is sacred. We implement enterprise-grade security and transparency.',
    image: '/images/security.jpg',
    icon: '🛡️',
    color: 'from-emerald-500 to-teal-500'
  },
  {
    title: 'Inclusive Design',
    description: 'Technology should be accessible to everyone, regardless of technical background.',
    image: '/images/inclusive.jpg',
    icon: '♿',
    color: 'from-orange-500 to-red-500'
  }
]

const testimonials = [
  {
    name: 'Maria Santos',
    role: 'Barangay Captain',
    community: 'Barangay San Antonio',
    content: 'E-Community transformed how we engage with our residents. Transparency has never been this easy.',
    image: '/images/testimonial-1.jpg',
    rating: 5
  },
  {
    name: 'Dr. Roberto Cruz',
    role: 'Condo Association President',
    community: 'Vista Residences',
    content: 'The platform streamlined our decision-making process. Our community is more connected than ever.',
    image: '/images/testimonial-2.jpg',
    rating: 5
  },
  {
    name: 'Prof. Elena Reyes',
    role: 'School Administrator',
    community: 'St. Mary Academy',
    content: 'From announcements to feedback collection, E-Community handles it all seamlessly.',
    image: '/images/testimonial-3.jpg',
    rating: 5
  }
]

const timeline = [
  { year: '2023', event: 'Founded E-Community', description: 'Started with a vision to democratize community management', icon: '🚀' },
  { year: '2024', event: '500+ Communities', description: 'Reached milestone of serving over 500 communities worldwide', icon: '🏘️' },
  { year: '2024', event: '50K+ Users', description: 'Grew to serve over 50,000 active community members', icon: '👥' },
  { year: '2025', event: 'AI Integration', description: 'Launched AI-powered insights and assistant features', icon: '🤖' }
]

export default function AboutUs() {
  const { isDark } = useTheme()
  const [currentValue, setCurrentValue] = useState(0)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [currentTimeline, setCurrentTimeline] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Mouse tracking for parallax effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const parallaxX = useTransform(mouseX, [-500, 500], [-20, 20])
  const parallaxY = useTransform(mouseY, [-500, 500], [-20, 20])

  // Auto-play carousels
  useEffect(() => {
    if (!isAutoPlaying) return

    const valueInterval = setInterval(() => {
      setCurrentValue((prev) => (prev + 1) % values.length)
    }, 5000)

    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 6000)

    return () => {
      clearInterval(valueInterval)
      clearInterval(testimonialInterval)
    }
  }, [isAutoPlaying])

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.clientX - window.innerWidth / 2)
    mouseY.set(e.clientY - window.innerHeight / 2)
  }

  return (
    <section
      id="about"
      className={`relative py-32 px-6 overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}
      onMouseMove={handleMouseMove}
    >
      {/* Dynamic Parallax Background */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        style={{ x: parallaxX, y: parallaxY }}
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`absolute top-20 left-10 w-72 h-72 ${isDark ? 'bg-gradient-to-br from-slate-400/10 to-slate-600/10' : 'bg-gradient-to-br from-slate-400/20 to-slate-600/20'} rounded-full blur-3xl`}
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`absolute bottom-20 right-10 w-96 h-96 ${isDark ? 'bg-gradient-to-br from-slate-400/10 to-slate-600/10' : 'bg-gradient-to-br from-slate-400/20 to-slate-600/20'} rounded-full blur-3xl`}
        />
      </motion.div>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Hero Section with Split-Screen Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="text-center mb-24"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-block mb-8"
          >
            <div className={`px-6 py-3 rounded-full ${isDark ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-sm border ${isDark ? 'border-slate-700' : 'border-slate-200'} shadow-lg`}>
              <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>About E-Community</span>
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className={`text-4xl md:text-5xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} mb-6`}
          >
            Empowering Communities Through
            <span className={`bg-gradient-to-r from-slate-600 to-slate-800 ${isDark ? 'dark:from-slate-300 dark:to-slate-100' : ''} bg-clip-text text-transparent`}> Technology</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className={`text-xl ${isDark ? 'text-slate-400' : 'text-slate-600'} max-w-3xl mx-auto mb-12`}
          >
            We're revolutionizing community management by combining technology with human-centric design to create more connected, efficient, and democratic communities.
          </motion.p>

          {/* Split-Screen Hero Carousel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="relative max-w-6xl mx-auto px-4"
          >
            {/* Mobile Layout - Image as Background */}
            <div className="block md:hidden relative rounded-2xl overflow-hidden shadow-2xl min-h-[500px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentValue}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.7 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={values[currentValue].image}
                    alt={values[currentValue].title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
                </motion.div>
              </AnimatePresence>

              {/* Mobile Text Overlay */}
              <div className="relative z-10 p-6 flex flex-col justify-end h-full text-white">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentValue}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-4"
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                      <span className="text-lg">{values[currentValue].icon}</span>
                      <span className="text-xs font-medium">Core Value</span>
                    </div>

                    <h3 className="text-2xl font-bold">
                      {values[currentValue].title}
                    </h3>

                    <p className="text-base leading-relaxed opacity-90">
                      {values[currentValue].description}
                    </p>

                    <div className="flex gap-2 justify-center">
                      {values.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentValue(index)}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === currentValue
                              ? 'bg-white scale-125'
                              : 'bg-white/50 hover:bg-white/70'
                          }`}
                        />
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Mobile Navigation Arrows */}
              <div className="absolute inset-y-0 left-2 flex items-center">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCurrentValue((prev) => (prev - 1 + values.length) % values.length)}
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
              </div>

              <div className="absolute inset-y-0 right-2 flex items-center">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCurrentValue((prev) => (prev + 1) % values.length)}
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Desktop/Tablet Layout - Split Screen */}
            <div className={`hidden md:grid md:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl ${isDark ? 'bg-slate-800' : 'bg-white'} min-h-[400px]`}>
              {/* Left Side - Text Content */}
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentValue}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6"
                  >
                    <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full ${isDark ? 'bg-slate-700/50' : 'bg-slate-100/50'} backdrop-blur-sm`}>
                      <span className="text-2xl">{values[currentValue].icon}</span>
                      <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Core Value</span>
                    </div>

                    <h3 className={`text-2xl lg:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {values[currentValue].title}
                    </h3>

                    <p className={`text-lg leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {values[currentValue].description}
                    </p>

                    <div className="flex gap-2">
                      {values.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentValue(index)}
                          className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            index === currentValue
                              ? 'bg-slate-600 scale-125'
                              : isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-300 hover:bg-slate-400'
                          }`}
                        />
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Right Side - Image Carousel */}
              <div className="relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentValue}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.7 }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={values[currentValue].image}
                      alt={values[currentValue].title}
                      fill
                      className="object-cover"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-l from-black/20 via-transparent to-black/40`}></div>
                  </motion.div>
                </AnimatePresence>

                {/* Navigation Arrows */}
                <div className="absolute inset-y-0 left-4 flex items-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setCurrentValue((prev) => (prev - 1 + values.length) % values.length)}
                    className={`w-10 h-10 rounded-full ${isDark ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-sm flex items-center justify-center shadow-lg`}
                  >
                    <svg className={`w-5 h-5 ${isDark ? 'text-white' : 'text-slate-900'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </motion.button>
                </div>

                <div className="absolute inset-y-0 right-4 flex items-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setCurrentValue((prev) => (prev + 1) % values.length)}
                    className={`w-10 h-10 rounded-full ${isDark ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-sm flex items-center justify-center shadow-lg`}
                  >
                    <svg className={`w-5 h-5 ${isDark ? 'text-white' : 'text-slate-900'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Story Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mb-25 flex flex-col md:flex-row items-center justify-center gap-8 mt-16"
        >
          <div className={`flex items-center gap-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-slate-800' : 'bg-white'} flex items-center justify-center shadow-lg`}>
              <svg className={`w-6 h-6 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-semibold">Founded 2023</div>
              <div className="text-sm">Started with a vision</div>
            </div>
          </div>

          <div className={`hidden md:block w-16 h-px ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></div>

          <div className={`flex items-center gap-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-slate-800' : 'bg-white'} flex items-center justify-center shadow-lg`}>
              <svg className={`w-6 h-6 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-semibold">500+ Communities</div>
              <div className="text-sm">Growing rapidly</div>
            </div>
          </div>

          <div className={`hidden md:block w-16 h-px ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></div>

          <div className={`flex items-center gap-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-slate-800' : 'bg-white'} flex items-center justify-center shadow-lg`}>
              <svg className={`w-6 h-6 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-semibold">AI Integration</div>
              <div className="text-sm">Smart insights</div>
            </div>
          </div>
        </motion.div>

        {/* Stats Section with Multi-Item Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{
                  scale: 1.05,
                  y: -5,
                  transition: { duration: 0.3 }
                }}
                className={`text-center p-6 rounded-2xl ${isDark ? 'bg-slate-800/50' : 'bg-white/50'} backdrop-blur-sm ${isDark ? 'border-slate-700/50' : 'border-slate-200/50'} shadow-lg hover:shadow-xl transition-all duration-300`}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.2, type: 'spring' }}
                  className="w-12 h-12 mx-auto mb-4 flex items-center justify-center"
                >
                  <span className="text-3xl">{stat.icon}</span>
                </motion.div>
                <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-1`}>
                  {stat.value}
                </div>
                <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Fade Carousel for Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20"
        >
          <div className="text-center mb-16">
            <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-4`}>
              What Our Communities Say
            </h3>
            <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'} max-w-2xl mx-auto`}>
              Real stories from real community leaders who trust E-Community.
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="relative h-80 overflow-hidden rounded-3xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className={`absolute inset-0 p-8 ${isDark ? 'bg-slate-800/50' : 'bg-white/50'} backdrop-blur-sm ${isDark ? 'border-slate-700/50' : 'border-slate-200/50'} shadow-2xl flex items-center`}
                >
                  <div className="flex items-start gap-6 w-full">
                    <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={testimonials[currentTestimonial].image}
                        alt={testimonials[currentTestimonial].name}
                        width={80}
                        height={80}
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`flex gap-1`}>
                          {Array.from({ length: testimonials[currentTestimonial].rating }).map((_, i) => (
                            <span key={i} className="text-yellow-400">★</span>
                          ))}
                        </div>
                      </div>
                      <blockquote className={`text-xl leading-relaxed mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        "{testimonials[currentTestimonial].content}"
                      </blockquote>
                      <div>
                        <div className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {testimonials[currentTestimonial].name}
                        </div>
                        <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {testimonials[currentTestimonial].role}
                        </div>
                        <div className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                          {testimonials[currentTestimonial].community}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Fade Carousel Navigation */}
            <div className="flex justify-center items-center gap-4 mt-8">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                className={`w-12 h-12 rounded-full ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-100'} shadow-lg flex items-center justify-center transition-colors duration-200`}
              >
                <svg className={`w-6 h-6 ${isDark ? 'text-white' : 'text-slate-900'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>

              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.2 }}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === currentTestimonial
                        ? 'bg-slate-600 scale-125'
                        : isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
                className={`w-12 h-12 rounded-full ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-100'} shadow-lg flex items-center justify-center transition-colors duration-200`}
              >
                <svg className={`w-6 h-6 ${isDark ? 'text-white' : 'text-slate-900'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Mission Statement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className={`text-center mt-20 p-12 rounded-3xl ${isDark ? 'bg-gradient-to-r from-slate-800/50 to-slate-900/50' : 'bg-gradient-to-r from-slate-100/50 to-slate-200/50'} backdrop-blur-sm ${isDark ? 'border-slate-700/50' : 'border-slate-200/50'} shadow-2xl`}
        >
          <motion.div
            animate={{
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="max-w-4xl mx-auto"
          >
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-6`}
            >
              "Building bridges between technology and community spirit"
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
            >
              We're not just creating software – we're fostering stronger, more connected communities where every voice matters and every decision is made together.
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
