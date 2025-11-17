// lib/auth.ts

import NextAuth from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

// Supabase client for custom queries
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const authOptions: NextAuthOptions = {
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
          image: user.image,
          role: user.role || 'Guest'
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Check if user exists
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email!)
            .single()

          if (!existingUser) {
            // Create new user
            const { data: newUser, error } = await supabase
              .from('users')
              .insert({
                name: user.name,
                email: user.email,
                email_verified: new Date().toISOString(),
                image: user.image,
                role: 'Guest'
              })
              .select()
              .single()

            if (error) {
              console.error('Error creating Google user:', error)
              return false
            }
            user.id = newUser.id
          } else {
            user.id = existingUser.id
          }
        } catch (error) {
          console.error('Google sign-in error:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account, trigger }) {
      // Remove excessive logging to prevent terminal spam

      // Initial sign in
      if (user) {
        token.id = user.id
        token.role = user.role
        token.name = user.name
        token.email = user.email
        // Set a timestamp for when we last fetched user data
        token.lastFetched = Date.now()
      }

      // Clean up any image data from old sessions (one-time cleanup)
      if (token.picture || token.image || (token as any).userImage) {
        delete token.picture
        delete token.image
        delete (token as any).userImage
      }

      // Only fetch user data if it's been more than 5 minutes since last fetch
      // or if this is an update trigger, or if we don't have the data yet
      const shouldFetchData = !token.lastFetched ||
        (Date.now() - (token.lastFetched as number)) > (5 * 60 * 1000) || // 5 minutes
        trigger === 'update' ||
        !token.role ||
        !token.name

      if (token.id && shouldFetchData) {
        try {
          // Check community role first
          const { data: communityRole } = await supabase
            .from('community_members')
            .select('role')
            .eq('user_id', token.id)
            .single()

          if (communityRole) {
            token.role = communityRole.role
          } else {
            // Fallback to user role
            const { data: userRole } = await supabase
              .from('users')
              .select('role')
              .eq('id', token.id)
              .single()

            token.role = userRole?.role || 'Guest'
          }

          // Fetch user name and status
          const { data: userData } = await supabase
            .from('users')
            .select('name, status')
            .eq('id', token.id)
            .single()

          if (userData) {
            token.name = userData.name
            token.status = userData.status || 'active'
          }

          // Update last fetched timestamp
          token.lastFetched = Date.now()
        } catch (error) {
          console.error('Error fetching user data:', error)
          // Set defaults if fetch fails
          if (!token.role) token.role = 'Guest'
          if (!token.status) token.status = 'active'
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.verification_status = token.status as 'unverified' | 'pending' | 'approved' | 'rejected' | undefined
        // Image is not stored in JWT to avoid size limits - fetch separately when needed
        session.user.name = token.name as string | undefined
        // Ensure no large data is stored in session
        session.user.email = token.email as string | undefined
      }
      return session
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
    updateAge: 24 * 60 * 60, // Refresh every day
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    secret: process.env.NEXTAUTH_SECRET,
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

export default NextAuth(authOptions)
