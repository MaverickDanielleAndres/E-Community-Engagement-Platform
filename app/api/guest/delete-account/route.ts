// @/app/api/guest/delete-account/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSupabaseServerClient } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'Guest') {
      return NextResponse.json(
        { error: 'Unauthorized. Only guests can delete their own account.' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const supabase = getSupabaseServerClient()

    // Delete from community_members if exists (guests might have joined)
    const { error: communityError } = await supabase
      .from('community_members')
      .delete()
      .eq('user_id', userId)

    if (communityError) {
      console.error('Error deleting from community_members:', communityError)
      // Continue anyway, as it's not critical
    }

    // Delete the user account
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (userError) {
      console.error('Error deleting user:', userError)
      return NextResponse.json(
        { error: 'Failed to delete account. Please try again.' },
        { status: 500 }
      )
    }

    // Clear NextAuth cookies to destroy session
    const response = NextResponse.redirect(new URL('/', request.url))

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
    console.error('Server error during account deletion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
