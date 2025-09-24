// @/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Find user in database
          const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', credentials.email)
            .single()

          if (error || !user) {
            console.log('User not found:', credentials.email)
            return null
          }

          // Check if email is verified
          if (!user.email_verified) {
            throw new Error('Please verify your email before signing in')
          }

          // Check if user has a password (not OAuth only)
          if (!user.hashed_password) {
            throw new Error('Please sign in with your OAuth provider')
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.hashed_password)
          
          if (!isPasswordValid) {
            console.log('Invalid password for user:', credentials.email)
            return null
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image
          }
        } catch (error) {
          console.error('Auth error:', error)
          throw error
        }
      }
    })
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Check if user already exists
          const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email!)
            .single()

          if (existingUser) {
            user.id = existingUser.id
            return true
          } else {
            // Create new user for Google OAuth
            const { data: newUser, error: userError } = await supabase
              .from('users')
              .insert([
                {
                  name: user.name,
                  email: user.email,
                  email_verified: new Date().toISOString(),
                  image: user.image,
                  role: 'Guest' // Default role for new OAuth users
                }
              ])
              .select('id')
              .single()

            if (userError || !newUser) {
              console.error('Failed to create user:', userError)
              return false
            }

            user.id = newUser.id
            return true
          }
        } catch (error) {
          console.error('Google sign-in error:', error)
          return false
        }
      }
      
      return true
    },

    async jwt({ token, user, account, trigger }) {
      // On signin, add user ID to token
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }

      // Fetch user role from database
      if (token.id) {
        try {
          // First, check if user is a community member (has specific role)
          const { data: communityMember } = await supabase
            .from('community_members')
            .select('role')
            .eq('user_id', token.id as string)
            .single()

          if (communityMember) {
            token.role = communityMember.role
          } else {
            // Fallback to user table role
            const { data: userData } = await supabase
              .from('users')
              .select('role')
              .eq('id', token.id as string)
              .single()

            token.role = userData?.role || 'Guest'
          }
        } catch (error) {
          console.error('Error fetching user role:', error)
          token.role = 'Guest'
        }
      }

      // Force refresh token data on update
      if (trigger === 'update') {
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, email, image, role')
          .eq('id', token.id as string)
          .single()

        if (userData) {
          token.name = userData.name
          token.email = userData.email
          token.picture = userData.image
          token.role = userData.role
        }

        // Re-fetch community role on update
        try {
          const { data: communityMember } = await supabase
            .from('community_members')
            .select('role')
            .eq('user_id', token.id as string)
            .single()

          if (communityMember) {
            token.role = communityMember.role
          }
        } catch (error) {
          console.error('Error re-fetching user role:', error)
        }
      }

      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
        session.user.role = token.role as string
      }
      return session
    }
  },

  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours - refresh session every day
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    },
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      console.log(`User ${user.email} signed in with ${account?.provider}`)
    },
    async signOut({ token }) {
      console.log(`User ${token?.email} signed out`)
    },
    async createUser({ user }) {
      console.log(`New user created: ${user.email}`)
    }
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }