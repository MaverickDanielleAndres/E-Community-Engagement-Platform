import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    // Get user with status
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, status')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      console.error('User not found:', userError)
      // Return 'deleted' status for deleted accounts
      return NextResponse.json({
        success: true,
        status: 'deleted'
      })
    }

    // If user is approved, return approved
    if (user.status === 'approved') {
      return NextResponse.json({
        success: true,
        status: 'approved'
      })
    }

    // If user is unverified, return unverified
    if (user.status === 'unverified') {
      return NextResponse.json({
        success: true,
        status: 'unverified'
      })
    }

    // If user is rejected, return rejected
    if (user.status === 'rejected') {
      return NextResponse.json({
        success: true,
        status: 'rejected'
      })
    }

    // If user is pending, check verification status
    if (user.status === 'pending') {
      const { data: verification, error: verificationError } = await supabase
        .from('id_verifications')
        .select('status')
        .eq('user_id', user.id)
        .single()

      if (verificationError) {
        console.error('Verification lookup error:', verificationError)
        return NextResponse.json({
          success: false,
          message: 'Error checking verification status'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        status: verification.status // 'pending', 'approved', or 'rejected'
      })
    }

    // Default to unverified if status is unknown
    return NextResponse.json({
      success: true,
      status: 'unverified'
    })

  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred'
    }, { status: 500 })
  }
}
