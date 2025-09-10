//@/components/FAQAccordion.tsx

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from './ThemeContext'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

const faqs = [
  {
    question: "Is my data private and secure?",
    answer: "Yes, absolutely. We use end-to-end encryption, role-based access controls, and maintain comprehensive audit logs. Only authorized community administrators can see complaint details, and all personal data is handled in compliance with GDPR and local privacy laws."
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

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className={`py-20 px-6 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'} sm:text-4xl mb-4`}>
            Frequently Asked
            <span className={`bg-gradient-to-r from-slate-600 to-slate-800 ${isDark ? 'dark:from-slate-300 dark:to-slate-100' : ''} bg-clip-text text-transparent`}> Questions</span>
          </h2>
          <p className={`text-lg ${isDark ? 'text-white/80' : 'text-black/80'} max-w-2xl mx-auto`}>
            Got questions? We've got answers. If you can't find what you're looking for, 
            feel free to reach out to our support team.
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`bg-white ${isDark ? 'dark:bg-slate-800' : ''} rounded-2xl border ${isDark ? 'border-slate-700' : 'border-slate-200'} overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300`}
            >
              <button
                onClick={() => toggleAccordion(index)}
                className={`w-full px-6 py-5 text-left flex items-center justify-between ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'} transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-inset`}
                aria-expanded={openIndex === index}
              >
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-black'} pr-4`}>
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <ChevronDownIcon className={`w-5 h-5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 pt-2">
                      <p className={`leading-relaxed ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className={`text-center mt-12 p-8 bg-gradient-to-r ${isDark ? 'from-slate-800/30 to-slate-900/30' : 'from-slate-100/50 to-slate-200/50'} rounded-2xl border ${isDark ? 'border-slate-700/50' : 'border-slate-200/50'}`}
        >
          <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-black'} mb-2`}>
            Still have questions?
          </h3>
          <p className={`mb-4 ${isDark ? 'text-white/80' : 'text-black/80'}`}>
            Our team is here to help you get the most out of E-Community.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`bg-gradient-to-r ${isDark ? 'from-slate-700 to-slate-800' : 'from-slate-700 to-slate-900'} text-white px-6 py-3 rounded-2xl font-semibold hover:from-slate-800 hover:to-slate-900 transition-all duration-200 shadow-lg hover:shadow-xl`}
          >
            Contact Support
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}