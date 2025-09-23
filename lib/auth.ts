// lib/auth.ts

import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { SupabaseAdapter } from '@auth/supabase-adapter'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

// Supabase client for custom queries
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const authOptions: NextAuthOptions = {
  // Type cast the adapter to avoid TypeScript errors
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }) as any,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        // Find user in Supabase
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single()

        if (error || !user) {
          throw new Error('No user found with this email')
        }

        // Check if user has a password (OAuth users might not)
        if (!user.hashed_password) {
          throw new Error('Please sign in with your OAuth provider')
        }

        // Verify password
        const isValid = await bcrypt.compare(credentials.password, user.hashed_password)
        
        if (!isValid) {
          throw new Error('Invalid password')
        }

        // Check if email is verified
        if (!user.email_verified) {
          throw new Error('Please verify your email before signing in')
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        token.accessToken = account.access_token
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken
        session.user.id = token.id as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Handle OAuth sign in
      if (account?.provider === 'google') {
        // Update user info if needed
        const { data, error } = await supabase
          .from('users')
          .update({
            name: user.name,
            image: user.image,
            email_verified: new Date()
          })
          .eq('email', user.email)
          .select()
        
        if (error) {
          console.error('Error updating user:', error)
        }
      }
      return true
    }
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_JWT_SECRET,
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

export default NextAuth(authOptions)