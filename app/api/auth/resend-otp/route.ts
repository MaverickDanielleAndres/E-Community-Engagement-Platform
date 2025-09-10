// @/app/api/auth/resend-otp/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { EmailVerificationService } from '@/lib/email-verification'
import { z } from 'zod'

const resendSchema = z.object({
  email: z.string().email('Please enter a valid email address')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const { email } = resendSchema.parse(body)
    
    console.log('Resending OTP to:', email)
    
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