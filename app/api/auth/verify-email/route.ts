// @/app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { EmailVerificationService } from '@/lib/email-verification-dev'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const verifySchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  code: z.string().min(6, 'Verification code must be 6 digits').max(6, 'Verification code must be 6 digits')
})

const resendSchema = z.object({
  email: z.string().email('Please enter a valid email address')
})

// POST - Verify OTP and create user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Verification request received:', body)
    
    // Validate request body
    const { email, code } = verifySchema.parse(body)
    
    console.log('Verifying OTP for email:', email, 'with code:', code)
    
    // Find temp user with verification code
    const { data: tempUser, error: tempUserError } = await supabase
      .from('temp_users')
      .select('*')
      .eq('email', email)
      .single()

    if (!tempUser || tempUserError) {
      console.log('No temp user found for:', email)
      return NextResponse.json({
        success: false,
        message: 'No verification code found. Please request a new one.'
      }, { status: 400 })
    }

    console.log('Found temp user:', { ...tempUser, hashed_password: '[HIDDEN]' })

    // Check if code has expired
    const now = new Date()
    const expires = new Date(tempUser.expires_at)

    if (now > expires) {
      console.log('Code expired for:', email)
      // Delete expired record
      await supabase
        .from('temp_users')
        .delete()
        .eq('email', email)

      return NextResponse.json({
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      }, { status: 400 })
    }

    // Verify code
    if (tempUser.verification_code !== code.trim()) {
      console.log('Invalid code for:', email, 'expected:', tempUser.verification_code, 'got:', code.trim())
      return NextResponse.json({
        success: false,
        message: 'Invalid verification code. Please check and try again.'
      }, { status: 400 })
    }
    
    console.log('Code verified successfully for:', email)
    
    // Check if user already exists (double-check)
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      console.log('User already exists:', email)
      // Clean up temp user
      await supabase
        .from('temp_users')
        .delete()
        .eq('email', email)
        
      return NextResponse.json({
        success: false,
        message: 'An account with this email already exists'
      }, { status: 400 })
    }
    
    // Validate community code if provided
    let communityId = null
    if (tempUser.community_code) {
      const { data: community, error: communityError } = await supabase
        .from('communities')
        .select('id')
        .eq('code', tempUser.community_code)
        .single()

      if (!community || communityError) {
        console.log('Invalid community code:', tempUser.community_code)
        return NextResponse.json({
          success: false,
          message: 'Invalid community code'
        }, { status: 400 })
      }
      communityId = community.id
      console.log('Community found:', communityId)
    }
    
    // Create the user in the database
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([
        {
          name: tempUser.name,
          email: email,
          email_verified: new Date().toISOString(),
          hashed_password: tempUser.hashed_password,
          status: 'unverified'
        }
      ])
      .select('id')
      .single()
    
    if (userError || !newUser) {
      console.error('User creation error:', userError)
      return NextResponse.json({
        success: false,
        message: 'Failed to create user account'
      }, { status: 500 })
    }
    
    console.log('User created successfully:', newUser.id)
    
    // Community addition will be handled later after full verification
    // Skip for now as per flow
    
    // Clean up temp user
    await supabase
      .from('temp_users')
      .delete()
      .eq('email', email)
    
    console.log('Temp user cleaned up, verification complete')
    
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! Your account has been created.',
      user_id: newUser.id
    })
    
  } catch (error) {
    console.error('Email verification error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid verification data'
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred during verification'
    }, { status: 500 })
  }
}

// PUT - Resend OTP
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Resend request received:', body)
    
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
      console.log('No temp user found for resend:', email)
      return NextResponse.json({
        success: false,
        message: 'No pending registration found for this email. Please sign up again.'
      }, { status: 400 })
    }
    
    // Check if it's too soon to resend (rate limiting - 1 minute)
    const now = new Date()
    const lastSent = new Date(tempUser.created_at)
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000)
    
    if (lastSent > oneMinuteAgo) {
      const remainingSeconds = Math.ceil((60 - (now.getTime() - lastSent.getTime()) / 1000))
      console.log('Rate limit hit for:', email, 'remaining seconds:', remainingSeconds)
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
    
    console.log('Resend result:', result)
    
    return NextResponse.json({
      success: result.success,
      message: result.message
    }, { status: result.success ? 200 : 400 })
    
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