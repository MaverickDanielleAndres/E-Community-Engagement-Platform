// @/app/api/auth/resend-otp/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { EmailVerificationService } from '@/lib/email-verification-dev'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resendSchema = z.object({
  email: z.string().email('Please enter a valid email address')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const { email } = resendSchema.parse(body)
    
    console.log('Resending OTP to:', email)
    
    // Check if temp user exists
    const { data: tempUser, error: tempUserError } = await supabase
      .from('temp_users')
      .select('email, created_at')
      .eq('email', email)
      .single()
    
    if (!tempUser || tempUserError) {
      return NextResponse.json({
        success: false,
        message: 'No pending registration found for this email. Please sign up again.'
      }, { status: 400 })
    }
    
    // Check if it's too soon to resend (rate limiting - 6 seconds for development)
    const now = new Date()
    const lastSent = new Date(tempUser.created_at)
    const sixSecondsAgo = new Date(now.getTime() - 6 * 1000)

    if (lastSent > sixSecondsAgo) {
      const remainingSeconds = Math.ceil((6 - (now.getTime() - lastSent.getTime()) / 1000))
      return NextResponse.json({
        success: false,
        message: `Please wait ${remainingSeconds} seconds before requesting a new code.`
      }, { status: 429 })
    }
    
    // Generate new code and update temp user
    const newCode = EmailVerificationService.generateCode()
    const newExpiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    const { error: updateError } = await supabase
      .from('temp_users')
      .update({
        verification_code: newCode,
        expires_at: newExpiresAt.toISOString()
      })
      .eq('email', email)

    if (updateError) {
      console.error('Error updating temp user:', updateError)
      return NextResponse.json({
        success: false,
        message: 'Failed to generate new verification code'
      }, { status: 500 })
    }

    // Send new verification email
    const result = await EmailVerificationService.sendVerificationEmail(email)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      })
    } else {
      return NextResponse.json({
        success: false,
        message: result.message
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Resend OTP error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email address'
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Failed to resend verification code'
    }, { status: 500 })
  }
}