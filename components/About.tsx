'use client'

import { motion } from 'framer-motion'
import { useTheme } from './ThemeContext'
import { 
  EyeIcon, 
  DocumentCheckIcon, 
  ShieldCheckIcon, 
  GlobeAltIcon,
  UsersIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

const benefits = [
  {
    title: 'Complete Transparency',
    description: 'Every vote, complaint, and decision is recorded with full audit trails.',
    icon: EyeIcon
  },
  {
    title: 'Audit-Ready Exports',
    description: 'Generate comprehensive reports for governance and compliance.',
    icon: DocumentCheckIcon
  },
  {
    title: 'Secure Authentication',
    description: 'Multi-factor authentication and role-based access controls.',
    icon: ShieldCheckIcon
  },
  {
    title: 'Web-Only Access',
    description: 'No app downloads required - works on any device with a browser.',
    icon: GlobeAltIcon
  }
]

const stats = [
  { value: '500+', label: 'Communities' },
  { value: '50K+', label: 'Active Users' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' }
]

export default function About() {
  const { isDark } = useTheme()

  return (
    <section id="about" className={`py-20 px-6 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 ${isDark ? 'bg-gradient-to-r from-slate-700 to-slate-800' : 'bg-gradient-to-r from-slate-600 to-slate-700'} rounded-xl`}>
                <UsersIcon className="w-6 h-6 text-white" />
              </div>
              <span className={`text-sm font-semibold ${isDark ? 'text-white/60' : 'text-black/60'}`}>About E-Community</span>
            </div>

            <h2 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'} sm:text-4xl mb-6`}>
              Building stronger communities through
              <span className={`bg-gradient-to-r from-slate-600 to-slate-800 ${isDark ? 'dark:from-slate-300 dark:to-slate-100' : ''} bg-clip-text text-transparent`}> digital democracy</span>
            </h2>

            <div className={`prose prose-lg ${isDark ? 'text-white/80' : 'text-black/80'} mb-8`}>
              <p>
                E-Community empowers barangays, condominiums, schools, and businesses to make 
                collective decisions transparently and efficiently. Our platform bridges the gap 
                between traditional community management and modern digital engagement.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className={`flex-shrink-0 p-2 ${isDark ? 'bg-slate-800' : 'bg-slate-100'} rounded-lg`}>
                    <benefit.icon className={`w-5 h-5 ${isDark ? 'text-white/60' : 'text-black/60'}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-black'} mb-1`}>
                      {benefit.title}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-6"
            >
              {stats.map((stat, index) => (
                <div key={stat.label} className="text-center">
                  <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'} mb-1`}>
                    {stat.value}
                  </div>
                  <div className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Visual Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative">
              {/* Main Card */}
              <div className={`bg-white ${isDark ? 'dark:bg-slate-800' : ''} rounded-3xl p-8 shadow-2xl border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${isDark ? 'bg-gradient-to-r from-slate-700 to-slate-800' : 'bg-gradient-to-r from-slate-600 to-slate-700'} rounded-2xl flex items-center justify-center`}>
                      <SparklesIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>Community Poll</h3>
                      <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>New Playground Equipment</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-100 text-black'} rounded-full text-sm font-medium`}>
                    Active
                  </div>
                </div>

                {/* Poll Options */}
                <div className="space-y-3 mb-6">
                  <div className={`flex items-center justify-between p-3 ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'} rounded-xl`}>
                    <span className={isDark ? 'text-white' : 'text-black'}>Swing Set</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-24 h-2 ${isDark ? 'bg-slate-600' : 'bg-slate-200'} rounded-full overflow-hidden`}>
                        <div className={`w-16 h-full ${isDark ? 'bg-gradient-to-r from-slate-500 to-slate-600' : 'bg-gradient-to-r from-slate-600 to-slate-700'} rounded-full`}></div>
                      </div>
                      <span className={`text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>67%</span>
                    </div>
                  </div>
                  <div className={`flex items-center justify-between p-3 ${isDark ? 'bg-slate-700/50' : 'bg-slate-50'} rounded-xl`}>
                    <span className={isDark ? 'text-white' : 'text-black'}>Climbing Frame</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-24 h-2 ${isDark ? 'bg-slate-600' : 'bg-slate-200'} rounded-full overflow-hidden`}>
                        <div className={`w-8 h-full ${isDark ? 'bg-gradient-to-r from-slate-600 to-slate-700' : 'bg-gradient-to-r from-slate-500 to-slate-600'} rounded-full`}></div>
                      </div>
                      <span className={`text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>33%</span>
                    </div>
                  </div>
                </div>

                <div className={`flex items-center justify-between text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  <span>142 votes • 3 days left</span>
                  <span>85% participation</span>
                </div>
              </div>

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
                className={`absolute -top-4 -right-4 ${isDark ? 'bg-gradient-to-r from-slate-700 to-slate-800' : 'bg-gradient-to-r from-slate-600 to-slate-700'} text-white p-3 rounded-2xl shadow-lg`}
              >
                <ShieldCheckIcon className="w-6 h-6" />
              </motion.div>

              <motion.div
                animate={{ 
                  y: [0, 10, 0],
                  rotate: [0, -5, 0]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
                className={`absolute -bottom-4 -left-4 ${isDark ? 'bg-gradient-to-r from-slate-600 to-slate-700' : 'bg-gradient-to-r from-slate-700 to-slate-800'} text-white p-3 rounded-2xl shadow-lg`}
              >
                <DocumentCheckIcon className="w-6 h-6" />
              </motion.div>
            </div>

            {/* Background Glow */}
            <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-r from-slate-800/20 to-slate-900/20' : 'bg-gradient-to-r from-slate-400/20 to-slate-500/20'} rounded-3xl blur-3xl -z-10`}></div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}