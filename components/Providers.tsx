// @/components/Providers.tsx
'use client'

import { SessionProvider } from 'next-auth/react'
import { motion } from 'framer-motion'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider
      // Session will be refetched every 5 minutes
      refetchInterval={5 * 60}
      // Refetch session when window gains focus
      refetchOnWindowFocus={true}
      // Refetch session when user comes back online
      refetchWhenOffline={false}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </SessionProvider>
  )
}