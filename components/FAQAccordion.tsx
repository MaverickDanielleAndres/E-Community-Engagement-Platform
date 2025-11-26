//@/components/FAQAccordion.tsx

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from './ThemeContext'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

const faqs = [
  {
    question: "How does the messaging system work in E-Community?",
    answer: "Our messaging system enables real-time communication between community members, administrators, and groups. You can create group chats for specific topics, send direct messages, share files, and even react to messages. All conversations are encrypted and stored securely."
  },
  {
    question: "What can the AI assistant help me with?",
    answer: "Our AI assistant can answer questions about community policies, help navigate the platform, provide insights from community data, assist with complaint categorization, and even suggest solutions based on similar past issues. It's available 24/7 to support both residents and administrators."
  },
  {
    question: "How do announcements work?",
    answer: "Administrators can create and broadcast announcements to all community members or specific groups. Announcements appear prominently in the dashboard, can include attachments, and have read receipts to ensure important information reaches everyone. You can also schedule announcements for future dates."
  },
  {
    question: "What is the verification process for new members?",
    answer: "New members must submit identification documents (ID cards, proof of address) which are reviewed by community administrators. Once approved, members gain full access to voting, messaging, and other features. This ensures only verified residents participate in community decisions."
  },
  {
    question: "Is my data private and secure?",
    answer: "Yes, absolutely. We use end-to-end encryption for all communications, role-based access controls, and maintain comprehensive audit logs. Only authorized community administrators can see complaint details, and all personal data is handled in compliance with GDPR and local privacy laws."
  },
  {
    question: "Can residents vote anonymously?",
    answer: "This is administrator-controlled and depends on your community's preferences. Admins can configure polls to allow anonymous voting for sensitive topics, or require verified accounts for transparency. The choice is yours."
  },
  {
    question: "How do I get support if I need help?",
    answer: "We provide 24/7 support through multiple channels. You can email us at maverickdanielle@gmail.com, use our in-app chat system, or access our comprehensive help documentation. Our team typically responds within 2 hours."
  },
  {
    question: "What types of communities can use E-Community?",
    answer: "E-Community is designed for barangays, condominiums, homeowner associations, schools, corporate offices, and any organization that needs democratic decision-making tools. We customize features based on your community's specific needs."
  },
  {
    question: "Do I need to download an app?",
    answer: "No app download required! E-Community works entirely in your web browser on any device - desktop, tablet, or mobile. This ensures everyone in your community can participate regardless of their device preferences."
  },
  {
    question: "How much does it cost?",
    answer: "We offer flexible pricing based on community size. Small communities (under 50 members) can start free, with premium features available through affordable monthly plans. Contact us for enterprise pricing for larger organizations."
  }
]

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const { isDark } = useTheme()

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className={`relative py-24 px-6 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className="relative z-10 mx-auto max-w-4xl">
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
            className={`text-4xl md:text-5xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} mb-6`}
          >
            Frequently Asked
            <span className="bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent"> Questions</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className={`text-xl ${isDark ? 'text-slate-400' : 'text-slate-600'} max-w-3xl mx-auto`}
          >
            Got questions? We've got answers. If you can't find what you're looking for,
            feel free to reach out to our support team.
          </motion.p>
        </motion.div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`border ${isDark ? 'border-slate-700/50' : 'border-slate-200/50'} rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 relative`}
            >
              {/* Creative Hover Effect */}
              <div className={`absolute inset-0 bg-gradient-to-r from-slate-600/0 to-slate-800/0 hover:from-slate-600/5 hover:to-slate-800/5 transition-all duration-500 ${isDark ? 'hover:from-slate-500/10 hover:to-slate-700/10' : ''}`}></div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => toggleFAQ(index)}
                className={`w-full px-8 py-6 text-left flex items-center justify-between ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-white/50'} backdrop-blur-sm transition-all duration-300 relative z-10`}
              >
                <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
                  className={`p-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-100'} transition-colors duration-300`}
                >
                  <ChevronDownIcon className={`w-5 h-5 ${isDark ? 'text-white' : 'text-slate-600'}`} />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -10, opacity: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className={`px-8 pb-6 ${isDark ? 'text-slate-300' : 'text-slate-700'} text-base leading-relaxed`}
                    >
                      {faq.answer}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className={`text-center mt-20 p-12 bg-gradient-to-r ${isDark ? 'from-slate-800/50 to-slate-900/50' : 'from-slate-100/50 to-slate-200/50'} backdrop-blur-sm rounded-3xl border ${isDark ? 'border-slate-700/50' : 'border-slate-200/50'} shadow-2xl relative overflow-hidden`}
        >
          {/* Animated Background Elements */}
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
            className="absolute top-0 right-0 w-32 h-32 bg-slate-500/10 rounded-full blur-2xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [360, 0, 360]
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-0 left-0 w-24 h-24 bg-slate-500/10 rounded-full blur-2xl"
          />

          <div className="relative z-10">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'} mb-4`}
            >
              Still have questions?
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className={`text-lg mb-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
            >
              Our team is here to help you get the most out of E-Community.
            </motion.p>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.8 }}
              whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)' }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-slate-600 to-slate-800 text-white px-8 py-4 rounded-2xl font-semibold hover:from-slate-700 hover:to-slate-800 transition-all duration-300 shadow-lg"
            >
              Contact Support →
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
