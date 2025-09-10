// @/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { EmailVerificationService } from '@/lib/email-verification'
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

    // Send verification email
    const verificationResult = await EmailVerificationService.sendVerificationEmail(validatedData.email)
    
    if (!verificationResult.success) {
      return NextResponse.json(
        { message: verificationResult.message },
        { status: 429 }
      )
    }

    // Store temporary user data (don't create user yet - wait for verification)
    // You might want to use a proper temporary storage like Redis in production
    const tempUserData = {
      ...validatedData,
      hashedPassword: await bcrypt.hash(validatedData.password, 12),
      timestamp: new Date().toISOString()
    }

    // Store in a temporary collection or cache
    // For now, we'll return success and handle user creation in verification endpoint
    
    return NextResponse.json({
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