// @/app/api/debug/email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { EmailVerificationService } from '@/lib/email-verification'

export async function POST(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Debug endpoint not available in production' }, { status: 404 })
  }

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    console.log('=== EMAIL DEBUG START ===')
    console.log('Target email:', email)
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY)
    console.log('RESEND_API_KEY value:', process.env.RESEND_API_KEY?.substring(0, 10) + '...')
    console.log('CONTACT_EMAIL:', process.env.CONTACT_EMAIL)

    // Test email send
    const result = await EmailVerificationService.sendVerificationEmail(email)
    
    console.log('Email send result:', result)
    
    // Get the stored code for debugging
    const storedCode = EmailVerificationService.getStoredCode(email)
    console.log('Stored verification code:', storedCode)
    console.log('=== EMAIL DEBUG END ===')

    return NextResponse.json({
      success: result.success,
      message: result.message,
      debugInfo: {
        storedCode,
        hasResendKey: !!process.env.RESEND_API_KEY,
        environment: process.env.NODE_ENV
      }
    })

  } catch (error) {
    console.error('Debug email error:', error)
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}