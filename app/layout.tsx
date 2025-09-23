// @/app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { CustomThemeProvider } from '@/components/ThemeContext'
import { Providers } from '@/components/Providers'
import { LayoutWrapper } from '@/components/LayoutWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://e-community.vercel.app'),
  title: 'E-Community — Connect · Engage · Decide',
  description: 'Transparent, secure community engagement platform for barangays, condos, schools and businesses.',
  keywords: ['community', 'engagement', 'voting', 'democracy', 'barangay', 'condo', 'school', 'business'],
  authors: [{ name: 'E-Community Team' }],
  creator: 'E-Community',
  publisher: 'E-Community',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'E-Community — Connect · Engage · Decide',
    description: 'Transparent, secure community engagement platform for barangays, condos, schools and businesses.',
    type: 'website',
    url: 'https://e-community.vercel.app',
    siteName: 'E-Community',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'E-Community — Connect · Engage · Decide',
    description: 'Transparent, secure community engagement platform for barangays, condos, schools and businesses.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <CustomThemeProvider>
          <Providers>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </Providers>
        </CustomThemeProvider>
      </body>
    </html>
  )
}
