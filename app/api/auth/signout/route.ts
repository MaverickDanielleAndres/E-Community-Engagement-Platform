// @/app/api/auth/signout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (session) {
      console.log(`Server-side cleanup for user: ${session.user?.email}`)
      
      // Additional server-side cleanup if needed
      // e.g., invalidate refresh tokens, clear database sessions, etc.
    }

    // Create response
    const response = NextResponse.json({ 
      message: 'Signed out successfully' 
    }, { status: 200 })

    // Clear NextAuth cookies explicitly
    const cookieNames = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url'
    ]

    cookieNames.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    })

    return response
  } catch (error) {
    console.error('Server signout error:', error)
    return NextResponse.json(
      { message: 'Signout cleanup completed' },
      { status: 200 }
    )
  }
}