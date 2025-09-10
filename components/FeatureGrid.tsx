'use client'

import { motion } from 'framer-motion'
import { useTheme } from './ThemeContext'
import { 
  CheckBadgeIcon, 
  ChatBubbleLeftRightIcon, 
  ChartBarIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'

const features = [
  {
    title: 'Voting & Surveys',
    description: 'Create secure polls with deadlines, live results, and anomaly detection to ensure fair participation.',
    icon: CheckBadgeIcon,
    gradient: 'from-slate-600 to-slate-700',
    bgGradient: 'from-slate-100/30 to-slate-200/30 dark:from-slate-800/30 dark:to-slate-900/30'
  },
  {
    title: 'Complaint Center',
    description: 'Submit issues, attach photos, and track status until resolved with full transparency.',
    icon: ChatBubbleLeftRightIcon,
    gradient: 'from-slate-500 to-slate-600',
    bgGradient: 'from-slate-200/30 to-slate-300/30 dark:from-slate-700/30 dark:to-slate-800/30'
  },
  {
    title: 'Feedback & Sentiment',
    description: 'Collect feedback and visualize sentiment trends for better community decisions.',
    icon: ChartBarIcon,
    gradient: 'from-slate-700 to-slate-800',
    bgGradient: 'from-slate-300/30 to-slate-400/30 dark:from-slate-600/30 dark:to-slate-700/30'
  },
  {
    title: 'Community Management',
    description: 'Manage residents, roles, and permissions with granular access controls.',
    icon: UserGroupIcon,
    gradient: 'from-slate-600 to-slate-700',
    bgGradient: 'from-slate-400/30 to-slate-500/30 dark:from-slate-500/30 dark:to-slate-600/30'
  },
  {
    title: 'Security & Privacy',
    description: 'End-to-end encryption, audit logs, and GDPR-compliant data handling.',
    icon: ShieldCheckIcon,
    gradient: 'from-slate-800 to-slate-900',
    bgGradient: 'from-slate-500/30 to-slate-600/30 dark:from-slate-400/30 dark:to-slate-500/30'
  },
  {
    title: 'AI Insights',
    description: 'Smart analytics and recommendations powered by machine learning.',
    icon: LightBulbIcon,
    gradient: 'from-slate-700 to-slate-800',
    bgGradient: 'from-slate-600/30 to-slate-700/30 dark:from-slate-300/30 dark:to-slate-400/30'
  }
]

export default function FeatureGrid() {
  const { isDark } = useTheme()

  return (
    <section id="features" className={`py-20 px-6 ${isDark ? 'bg-black' : 'bg-white'}`}>
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'} sm:text-4xl`}>
            Everything you need for
            <span className={`bg-gradient-to-r from-slate-600 to-slate-800 ${isDark ? 'dark:from-slate-300 dark:to-slate-100' : ''} bg-clip-text text-transparent`}> community engagement</span>
          </h2>
          <p className={`mt-4 text-lg ${isDark ? 'text-white/80' : 'text-black/80'} max-w-2xl mx-auto`}>
            Powerful features designed to make community management transparent, efficient, and accessible to everyone.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ 
                y: -8, 
                transition: { duration: 0.2 } 
              }}
              className={`bg-gradient-to-br ${feature.bgGradient} rounded-2xl p-6 border ${isDark ? 'border-slate-700' : 'border-slate-200'} shadow-sm hover:shadow-lg transition-all duration-300`}
            >
              <div className="relative">
                <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-r ${feature.gradient} text-white mb-4`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                
                <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-black'} mb-3`}>
                  {feature.title}
                </h3>
                
                <p className={`leading-relaxed ${isDark ? 'text-white/80' : 'text-black/80'}`}>
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-16"
        >
          <div className={`bg-gradient-to-r ${isDark ? 'from-slate-800 to-slate-900' : 'from-slate-700 to-slate-900'} rounded-3xl p-8 text-white relative overflow-hidden`}>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-4">
                Ready to transform your community?
              </h3>
              <p className={`mb-6 max-w-2xl mx-auto ${isDark ? 'text-white/80' : 'text-white/90'}`}>
                Join hundreds of communities already using E-Community to make better decisions together.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`bg-white ${isDark ? 'text-black' : 'text-black'} px-8 py-3 rounded-2xl font-semibold hover:bg-slate-100 transition-colors duration-200`}
                >
                  Start Free Trial
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`border-2 border-white ${isDark ? 'text-white' : 'text-white'} px-8 py-3 rounded-2xl font-semibold hover:bg-white/10 transition-colors duration-200`}
                >
                  Schedule Demo
                </motion.button>
              </div>
            </div>
            
            {/* Background decorations */}
            <div className={`absolute -top-12 -right-12 w-32 h-32 ${isDark ? 'bg-white/10' : 'bg-white/20'} rounded-full blur-xl`}></div>
            <div className={`absolute -bottom-8 -left-8 w-24 h-24 ${isDark ? 'bg-white/10' : 'bg-white/20'} rounded-full blur-xl`}></div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}