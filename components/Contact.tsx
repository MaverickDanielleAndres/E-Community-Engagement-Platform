'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTheme } from './ThemeContext'
import { Button } from './Button'
import { Input } from './Input'
import { EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline'

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters')
})

type ContactFormData = z.infer<typeof contactSchema>

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { isDark } = useTheme()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema)
  })

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setIsSubmitted(true)
        reset()
        setTimeout(() => setIsSubmitted(false), 5000)
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Handle error (show toast, etc.)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" className={`relative py-24 px-6 overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Circular Gradient Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 50,
            repeat: Infinity,
            ease: "linear"
          }}
          className={`absolute top-1/4 -left-1/4 w-96 h-96 ${isDark ? 'bg-gradient-to-br from-gray-500/5 to-gray-600/5' : 'bg-gradient-to-br from-gray-400/10 to-gray-500/10'} rounded-full blur-3xl`}
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 55,
            repeat: Infinity,
            ease: "linear"
          }}
          className={`absolute bottom-1/4 -right-1/4 w-96 h-96 ${isDark ? 'bg-gradient-to-br from-gray-600/5 to-gray-700/5' : 'bg-gradient-to-br from-gray-500/10 to-gray-600/10'} rounded-full blur-3xl`}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`text-4xl md:text-5xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}
          >
            Get in
<span className={`bg-gradient-to-r ${isDark ? 'from-white to-gray-900' : 'from-gray-700 to-black'} bg-clip-text text-transparent`}> Touch</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className={`text-xl ${isDark ? 'text-slate-400' : 'text-slate-600'} max-w-3xl mx-auto`}
          >
            Ready to transform your community? Contact us for a demo or to discuss your specific needs.
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-6`}>
                Let's start a conversation
              </h3>
              <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-8`}>
                Contact the barangay admin at the address below or email for official matters.
                We're here to help you build a stronger, more connected community.
              </p>
            </motion.div>

            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                whileHover={{ x: 8, scale: 1.02 }}
                className={`flex items-center gap-6 p-6 ${isDark ? 'bg-slate-800/50' : 'bg-white/50'} backdrop-blur-sm rounded-3xl border ${isDark ? 'border-slate-700/50' : 'border-slate-200/50'} shadow-lg hover:shadow-xl transition-all duration-300`}
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-600'} rounded-2xl shadow-lg`}
                >
                  <EnvelopeIcon className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Email</h4>
                  <p className={`text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>maverickdanielle@gmail.com</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                whileHover={{ x: 8, scale: 1.02 }}
                className={`flex items-center gap-6 p-6 ${isDark ? 'bg-slate-800/50' : 'bg-white/50'} backdrop-blur-sm rounded-3xl border ${isDark ? 'border-slate-700/50' : 'border-slate-200/50'} shadow-lg hover:shadow-xl transition-all duration-300`}
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-600'} rounded-2xl shadow-lg`}
                >
                  <PhoneIcon className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Support</h4>
                  <p className={`text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>24/7 Available</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                whileHover={{ x: 8, scale: 1.02 }}
                className={`flex items-center gap-6 p-6 ${isDark ? 'bg-slate-800/50' : 'bg-white/50'} backdrop-blur-sm rounded-3xl border ${isDark ? 'border-slate-700/50' : 'border-slate-200/50'} shadow-lg hover:shadow-xl transition-all duration-300`}
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-gray-600'} rounded-2xl shadow-lg`}
                >
                  <MapPinIcon className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Location</h4>
                  <p className={`text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Las Piñas, Metro Manila, PH</p>
                </div>
              </motion.div>
            </div>

            {/* Response Time */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className={`bg-gradient-to-r ${isDark ? 'from-slate-800/50 to-slate-900/50' : 'from-slate-100/50 to-slate-200/50'} backdrop-blur-sm border ${isDark ? 'border-slate-700/50' : 'border-slate-200/50'} rounded-3xl p-8 shadow-xl relative overflow-hidden`}
            >
              {/* Animated circular backgrounds */}
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  rotate: [0, 360, 0]
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-gray-500/20 to-gray-600/20 rounded-full blur-xl"
              />

              <div className="relative z-10">
                <h4 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-slate-900'} mb-3`}>
                  Quick Response Guaranteed
                </h4>
                <p className={`text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  We typically respond to all inquiries within 2 hours during business hours,
                  and within 24 hours on weekends.
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`bg-gradient-to-br ${isDark ? 'from-slate-800/50 to-slate-900/50' : 'from-white/50 to-slate-50/50'} backdrop-blur-sm rounded-3xl p-8 shadow-2xl border ${isDark ? 'border-slate-700/50' : 'border-slate-200/50'} relative overflow-hidden`}
          >
            {/* Animated circular backgrounds */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 360, 0]
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-500/10 to-gray-600/10 rounded-full blur-2xl"
            />
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                rotate: [360, 0, 360]
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-br from-gray-600/10 to-gray-700/10 rounded-full blur-2xl"
            />

            <div className="relative z-10">
              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className={`w-20 h-20 ${isDark ? 'bg-gray-700' : 'bg-gray-600'} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}
                  >
                    <motion.svg
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                      className="w-10 h-10 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </motion.svg>
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-4`}
                  >
                    Message Sent!
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
                  >
                    Thank you for reaching out. We'll get back to you within 2 hours.
                  </motion.p>
                </motion.div>
              ) : (
                <motion.form
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name Field */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="relative"
                    >
                      <label className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'} mb-3`}>
                        Name
                      </label>
                      <input
                        {...register('name')}
                        className={`w-full px-4 py-3 ${isDark ? 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-500' : 'bg-white/50 border-slate-300 text-slate-900 placeholder-slate-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-300 backdrop-blur-sm`}
                        placeholder="Your name"
                      />
                      {errors.name && (
                        <p className="mt-2 text-sm text-red-500">
                          {errors.name.message}
                        </p>
                      )}
                    </motion.div>

                    {/* Email Field */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      className="relative"
                    >
                      <label className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'} mb-3`}>
                        Email
                      </label>
                      <input
                        type="email"
                        {...register('email')}
                        className={`w-full px-4 py-3 ${isDark ? 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-500' : 'bg-white/50 border-slate-300 text-slate-900 placeholder-slate-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-300 backdrop-blur-sm`}
                        placeholder="your@email.com"
                      />
                      {errors.email && (
                        <p className="mt-2 text-sm text-red-500">
                          {errors.email.message}
                        </p>
                      )}
                    </motion.div>
                  </div>

                  {/* Subject Field */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="relative"
                  >
                    <label className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'} mb-3`}>
                      Subject
                    </label>
                    <input
                      {...register('subject')}
                      className={`w-full px-4 py-3 ${isDark ? 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-500' : 'bg-white/50 border-slate-300 text-slate-900 placeholder-slate-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-300 backdrop-blur-sm`}
                      placeholder="How can we help?"
                    />
                    {errors.subject && (
                      <p className="mt-2 text-sm text-red-500">
                        {errors.subject.message}
                      </p>
                    )}
                  </motion.div>

                  {/* Message Field */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="relative"
                  >
                    <label className={`block text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'} mb-3`}>
                      Message
                    </label>
                    <textarea
                      {...register('message')}
                      rows={5}
                      className={`w-full px-4 py-3 ${isDark ? 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-500' : 'bg-white/50 border-slate-300 text-slate-900 placeholder-slate-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent transition-all duration-300 resize-none backdrop-blur-sm`}
                      placeholder="Tell us more about your community's needs..."
                    />
                    {errors.message && (
                      <p className="mt-2 text-sm text-red-500">
                        {errors.message.message}
                      </p>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                  >
                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black"
                      isLoading={isSubmitting}
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message →'}
                    </Button>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.9 }}
                    className={`text-sm text-center ${isDark ? 'text-slate-500' : 'text-slate-500'}`}
                  >
                    By submitting this form, you agree to our privacy policy and terms of service.
                  </motion.p>
                </motion.form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}