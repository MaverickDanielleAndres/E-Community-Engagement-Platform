import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase client for email verification
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json()
    
    if (!email || !code) {
      return NextResponse.json(
        { message: 'Email and code are required' },
        { status: 400 }
      )
    }

    // Find temp user with verification code
    const { data: tempUserData, error: tempUserError } = await supabase
      .from('temp_users')
      .select('*')
      .eq('email', email)
      .eq('verification_code', code)
      .single()
    
    if (tempUserError || !tempUserData) {
      return NextResponse.json(
        { message: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }
    
    // Check if code is expired
    const now = new Date()
    const expires = new Date(tempUserData.verification_code_expires_at)
    
    if (expires < now) {
      // Delete expired temp user
      await supabase
        .from('temp_users')
        .delete()
        .eq('email', email)
      
      return NextResponse.json(
        { message: 'Verification code has expired' },
        { status: 400 }
      )
    }
    
    // Create actual user in Supabase
    const { data: newUserData, error: createUserError } = await supabase
      .from('users')
      .insert({
        name: tempUserData.name,
        email: tempUserData.email,
        hashed_password: tempUserData.hashed_password,
        email_verified: new Date().toISOString()
      })
      .select()
      .single()
    
    if (createUserError) {
      console.error('Error creating user:', createUserError)
      return NextResponse.json(
        { message: 'Failed to create user account' },
        { status: 500 }
      )
    }
    
    // Handle community membership if code provided
    if (tempUserData.community_code) {
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select('id')
        .eq('code', tempUserData.community_code)
        .single()
      
      if (communityData && !communityError) {
        // Add user to community
        const { error: memberError } = await supabase
          .from('community_members')
          .insert({
            community_id: communityData.id,
            user_id: newUserData.id,
            role: tempUserData.role
          })
        
        if (memberError) {
          console.error('Error adding user to community:', memberError)
        }
      }
    }
    
    // Delete temp user data
    await supabase
      .from('temp_users')
      .delete()
      .eq('email', email)
    
    return NextResponse.json(
      { message: 'Email verified successfully. You can now sign in.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}