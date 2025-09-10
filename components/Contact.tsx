//@/components/Contact.tsx
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
    <section id="contact" className={`py-20 px-6 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'} sm:text-4xl mb-4`}>
            Get in
            <span className={`bg-gradient-to-r from-slate-600 to-slate-800 ${isDark ? 'dark:from-slate-300 dark:to-slate-100' : ''} bg-clip-text text-transparent`}> Touch</span>
          </h2>
          <p className={`text-lg ${isDark ? 'text-white/80' : 'text-black/80'} max-w-2xl mx-auto`}>
            Ready to transform your community? Contact us for a demo or to discuss your specific needs.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div>
              <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'} mb-4`}>
                Let's start a conversation
              </h3>
              <p className={`${isDark ? 'text-white/80' : 'text-black/80'} mb-8`}>
                Contact the barangay admin at the address below or email for official matters. 
                We're here to help you build a stronger, more connected community.
              </p>
            </div>

            <div className="space-y-6">
              <motion.div
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center gap-4 p-4 ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl border ${isDark ? 'border-slate-700' : 'border-slate-200'} shadow-sm`}
              >
                <div className={`p-3 ${isDark ? 'bg-slate-700' : 'bg-slate-100'} rounded-xl`}>
                  <EnvelopeIcon className={`w-6 h-6 ${isDark ? 'text-white' : 'text-black'}`} />
                </div>
                <div>
                  <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Email</h4>
                  <p className={`${isDark ? 'text-white/60' : 'text-black/60'}`}>maverickdanielle@gmail.com</p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center gap-4 p-4 ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl border ${isDark ? 'border-slate-700' : 'border-slate-200'} shadow-sm`}>
                <div className={`p-3 ${isDark ? 'bg-slate-700' : 'bg-slate-100'} rounded-xl`}>
                  <PhoneIcon className={`w-6 h-6 ${isDark ? 'text-white' : 'text-black'}`} />
                </div>
                <div>
                  <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Support</h4>
                  <p className={`${isDark ? 'text-white/60' : 'text-black/60'}`}>24/7 Available</p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center gap-4 p-4 ${isDark ? 'bg-slate-800' : 'bg-white'} rounded-2xl border ${isDark ? 'border-slate-700' : 'border-slate-200'} shadow-sm`}>
                <div className={`p-3 ${isDark ? 'bg-slate-700' : 'bg-slate-100'} rounded-xl`}>
                  <MapPinIcon className={`w-6 h-6 ${isDark ? 'text-white' : 'text-black'}`} />
                </div>
                <div>
                  <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Location</h4>
                  <p className={`${isDark ? 'text-white/60' : 'text-black/60'}`}>Las Piñas, Metro Manila, PH</p>
                </div>
              </motion.div>
            </div>

            {/* Response Time */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className={`bg-gradient-to-r ${isDark ? 'from-slate-800/30 to-slate-900/30' : 'from-slate-100/50 to-slate-200/50'} border ${isDark ? 'border-slate-700' : 'border-slate-200'} rounded-2xl p-6 shadow-sm`}
            >
              <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-black'} mb-2`}>
                Quick Response Guaranteed
              </h4>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                We typically respond to all inquiries within 2 hours during business hours, 
                and within 24 hours on weekends.
              </p>
            </motion.div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`bg-white ${isDark ? 'dark:bg-slate-800' : ''} rounded-3xl p-8 shadow-xl border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}
          >
            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className={`w-16 h-16 ${isDark ? 'bg-slate-700' : 'bg-slate-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <motion.svg
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5 }}
                    className={`w-8 h-8 ${isDark ? 'text-white' : 'text-black'}`}
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
                </div>
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'} mb-2`}>
                  Message Sent!
                </h3>
                <p className={`${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  Thank you for reaching out. We'll get back to you within 2 hours.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name Field */}
                  <div className="relative">
                    <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-black'} mb-2`}>
                      Name
                    </label>
                    <Input
                      {...register('name')}
                      error={errors.name?.message}
                      placeholder="Your name"
                      className="w-full"
                    />
                  </div>

                  {/* Email Field */}
                  <div className="relative">
                    <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-black'} mb-2`}>
                      Email
                    </label>
                    <Input
                      type="email"
                      {...register('email')}
                      error={errors.email?.message}
                      placeholder="your@email.com"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Subject Field */}
                <div className="relative">
                  <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-black'} mb-2`}>
                    Subject
                  </label>
                  <Input
                    {...register('subject')}
                    error={errors.subject?.message}
                    placeholder="How can we help?"
                    className="w-full"
                  />
                </div>

                {/* Message Field */}
                <div className="relative">
                  <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-black'} mb-2`}>
                    Message
                  </label>
                  <textarea
                    {...register('message')}
                    rows={5}
                    className={`w-full px-4 py-3 ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-white/40' : 'bg-white border-slate-300 text-black placeholder-black/40'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 resize-none`}
                    placeholder="Tell us more about your community's needs..."
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>

                <p className={`text-xs text-center ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                  By submitting this form, you agree to our privacy policy and terms of service.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}