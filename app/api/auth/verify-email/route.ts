// @/app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { EmailVerificationService } from '@/lib/email-verification'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const verifySchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  code: z.string().min(6, 'Verification code must be 6 digits').max(6, 'Verification code must be 6 digits'),
  userData: z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email(),
    password: z.string().min(8),
    communityCode: z.string().optional(),
    role: z.enum(['Resident', 'Admin', 'Guest']),
    terms: z.boolean()
  })
})

const resendSchema = z.object({
  email: z.string().email('Please enter a valid email address')
})

// POST - Verify OTP and create user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = verifySchema.parse(body)
    const { email, code, userData } = validatedData
    
    console.log('Verifying OTP for email:', email)
    
    // Verify the OTP code
    const verificationResult = EmailVerificationService.verifyCode(email, code)
    
    if (!verificationResult.success) {
      return NextResponse.json({
        success: false,
        message: verificationResult.message
      }, { status: 400 })
    }
    
    // Check if user already exists (double-check)
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'An account with this email already exists'
      }, { status: 400 })
    }
    
    // Validate community code if provided and role is Resident
    let communityId = null
    if (userData.communityCode && userData.role === 'Resident') {
      const { data: community, error: communityError } = await supabase
        .from('communities')
        .select('id')
        .eq('code', userData.communityCode)
        .single()

      if (!community || communityError) {
        return NextResponse.json({
          success: false,
          message: 'Invalid community code'
        }, { status: 400 })
      }
      communityId = community.id
    } else if (userData.communityCode && userData.role !== 'Resident') {
      // Optional community code for Admin/Guest
      const { data: community } = await supabase
        .from('communities')
        .select('id')
        .eq('code', userData.communityCode)
        .single()
      
      if (community) {
        communityId = community.id
      }
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 12)
    
    // Create the user in the database
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([
        {
          name: userData.fullName,
          email: email,
          email_verified: new Date().toISOString(),
          hashed_password: hashedPassword
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
    
    // Add user to community if communityId exists
    if (communityId) {
      const { error: memberError } = await supabase
        .from('community_members')
        .insert([
          {
            community_id: communityId,
            user_id: newUser.id,
            role: userData.role
          }
        ])
      
      if (memberError) {
        console.error('Community member creation error:', memberError)
        // Don't fail the entire process, just log the error
      }
    }
    
    console.log('User created successfully:', newUser.id)
    
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! Your account has been created.'
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
    
    // Validate request body
    const { email } = resendSchema.parse(body)
    
    console.log('Resending OTP to:', email)
    
    // Send new verification email
    const result = await EmailVerificationService.sendVerificationEmail(email)
    
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