// @/types/next-auth.d.ts
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      // image is not stored in session to avoid JWT size limits - fetch from API separately
      role?: string
      community?: {
        name: string
        code: string
      } | null
    }
    accessToken?: string
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string
    community?: {
      name: string
      code: string
    } | null
    accessToken?: string
  }
}