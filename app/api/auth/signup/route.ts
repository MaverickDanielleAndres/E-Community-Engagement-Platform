// @/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { EmailVerificationService } from '@/lib/email-verification-dev'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[0-9])/, 'Password must contain at least one number')
    .regex(/(?=.*[!@#$%^&*])/, 'Password must contain at least one symbol'),
  communityCode: z.string().optional(),
  role: z.enum(['Resident', 'Admin', 'Guest']),
  terms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = signupSchema.parse(body)
    
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', validatedData.email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { message: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // Validate community code if provided
    if (validatedData.communityCode) {
      const { data: community, error: communityError } = await supabase
        .from('communities')
        .select('id')
        .eq('code', validatedData.communityCode)
        .single()

      if (!community) {
        return NextResponse.json(
          { message: 'Invalid community code' },
          { status: 400 }
        )
      }
    }

    // Generate verification code and expiry
    const verificationCode = EmailVerificationService.generateCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Store temporary user data (don't create user yet - wait for verification)
    // You might want to use a proper temporary storage like Redis in production
    const tempUserData = {
      name: validatedData.fullName,
      email: validatedData.email,
      hashed_password: await bcrypt.hash(validatedData.password, 12),
      community_code: validatedData.communityCode || null,
      role: validatedData.role,
      verification_code: verificationCode,
      expires_at: expiresAt.toISOString()
    }

    // Insert temp user data into temp_users table
    const { error: tempUserError } = await supabase
      .from('temp_users')
      .insert([tempUserData])

    if (tempUserError) {
      console.error('Failed to store temp user data:', tempUserError)
      return NextResponse.json({
        success: false,
        message: 'Failed to store temporary user data'
      }, { status: 500 })
    }

    // Send verification email
    const verificationResult = await EmailVerificationService.sendVerificationEmail(validatedData.email)

    if (!verificationResult.success) {
      // Clean up temp user if email failed
      await supabase
        .from('temp_users')
        .delete()
        .eq('email', validatedData.email)

      return NextResponse.json(
        { message: verificationResult.message },
        { status: 429 }
      )
    }

    // For now, we'll return success and handle user creation in verification endpoint
    
    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email. Please check your inbox.',
      email: validatedData.email
    })
    
  } catch (error) {
    console.error('Signup error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: 'Validation failed',
          errors: error.errors.map(e => ({ field: e.path[0], message: e.message }))
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}