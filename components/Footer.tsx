'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTheme } from './ThemeContext'

const navigation = {
  main: [
    { name: 'About', href: '#about' },
    { name: 'Features', href: '#features' },
    { name: 'FAQ', href: '#faq' },
    { name: 'Contact', href: '#contact' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
  ],
  social: [
    {
      name: 'Facebook',
      href: '#',
      icon: (props: any) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      name: 'Twitter',
      href: '#',
      icon: (props: any) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
        </svg>
      ),
    },
    {
      name: 'GitHub',
      href: '#',
      icon: (props: any) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      href: '#',
      icon: (props: any) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path
            fillRule="evenodd"
            d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  ],
}

export default function Footer() {
  const { isDark } = useTheme()
  const currentYear = new Date().getFullYear()

  return (
    <footer className={`border-t ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
      <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full space-y-8 md:space-y-0">
          
          {/* Left: Logo and Description */}
          <div className="flex flex-col space-y-4 md:flex-1">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3"
            >
              <div className={`w-8 h-8 ${isDark ? 'bg-gradient-to-r from-slate-700 to-slate-800' : 'bg-gradient-to-r from-slate-600 to-slate-700'} rounded-lg flex items-center justify-center`}>
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className={`font-bold text-xl bg-gradient-to-r from-slate-600 to-slate-800 ${isDark ? 'dark:from-slate-300 dark:to-slate-100' : ''} bg-clip-text text-transparent`}>E-Community</span>
            </motion.div>
            
            <p className={`text-sm max-w-md ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              Empowering communities through transparent, secure, and efficient digital engagement.
            </p>

            {/* Contact Info */}
            <div className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              <p>📧 maverickdanielle@gmail.com</p>
              <p className={isDark ? 'text-red-400' : 'text-red-500'}>📍 Las Piñas, Metro Manila, PH</p>
            </div>
          </div>

          {/* Center: Navigation Links */}
          <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-12 md:flex-1 md:justify-center">
            <div>
              <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'} mb-3`}>Navigation</h3>
              <ul className="space-y-2">
                {navigation.main.map((item) => (
                  <li key={item.name}>
                    <motion.div whileHover={{ x: 2 }}>
                      <Link
                        href={item.href}
                        className={`text-sm ${isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'} transition-colors duration-200`}
                      >
                        {item.name}
                      </Link>
                    </motion.div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'} mb-3`}>Legal</h3>
              <ul className="space-y-2">
                {navigation.legal.map((item) => (
                  <li key={item.name}>
                    <motion.div whileHover={{ x: 2 }}>
                      <Link
                        href={item.href}
                        className={`text-sm ${isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'} transition-colors duration-200`}
                      >
                        {item.name}
                      </Link>
                    </motion.div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Social Links and Newsletter */}
          <div className="flex flex-col space-y-4 md:flex-1 md:items-end">
            <div>
              <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'} mb-3 md:text-right`}>
                Stay Connected
              </h3>
              <div className="flex space-x-4 md:justify-end">
                {navigation.social.map((item) => (
                  <motion.a
                    key={item.name}
                    href={item.href}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`${isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'} transition-colors duration-200`}
                  >
                    <span className="sr-only">{item.name}</span>
                    <item.icon className="h-5 w-5" />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Newsletter Signup */}
            <div className="w-full md:w-64">
              <div className={`flex rounded-2xl overflow-hidden border ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>
                <input
                  type="email"
                  placeholder="Your email"
                  className={`flex-1 px-4 py-2 text-sm ${isDark ? 'bg-slate-800 text-white placeholder-white/40' : 'bg-white text-black placeholder-black/40'} border-none focus:outline-none focus:ring-0`}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 ${isDark ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white' : 'bg-gradient-to-r from-slate-700 to-slate-900 text-white'} text-sm font-medium hover:opacity-90 transition-opacity duration-200`}
                >
                  Subscribe
                </motion.button>
              </div>
              <p className={`text-xs mt-2 md:text-right ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                Get updates on new features
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={`border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} px-6 py-4`}>
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            © {currentYear} E-Community. All rights reserved.
          </p>
          
          <div className={`flex items-center space-x-4 text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            <span>Made with ❤️ by Maverick Danielle</span>
            <span>•</span>
            <span>Powered by Next.js & Tailwind</span>
          </div>
        </div>
      </div>
    </footer>
  )
}