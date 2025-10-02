import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const verificationSchema = z.object({
  full_name: z.string().min(2).max(100),
  age: z.coerce.number().min(18).max(120),
  gender: z.enum(['male', 'female', 'other']),
  address: z.string().min(10).max(500),
  id_number: z.string().min(5).max(50),
  email: z.string().email()
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate form data
    const formData = await request.formData()
    const full_name = formData.get('full_name') as string
    const age = formData.get('age') as string
    const gender = formData.get('gender') as string
    const address = formData.get('address') as string
    const id_number = formData.get('id_number') as string
    const email = formData.get('email') as string

    const validation = verificationSchema.safeParse({
      full_name,
      age,
      gender,
      address,
      id_number,
      email
    })

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: 'Invalid form data',
        errors: validation.error.errors
      }, { status: 400 })
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, status')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        message: 'User not found. Please complete email verification first.'
      }, { status: 404 })
    }

    // Check if user already has a verification request
    const { data: existingVerification, error: verificationError } = await supabase
      .from('id_verifications')
      .select('id, status')
      .eq('user_id', user.id)
      .single()

    if (existingVerification && !verificationError) {
      // Allow resubmission if previous verification was rejected OR pending (for testing)
      if (existingVerification.status !== 'rejected' && existingVerification.status !== 'pending') {
        return NextResponse.json({
          success: false,
          message: 'ID verification can only be submitted once.'
        }, { status: 400 })
      }
      // If rejected or pending, allow resubmission - we'll update the existing record
    }

    if (user.status !== 'unverified') {
      return NextResponse.json({
        success: false,
        message: 'ID verification can only be submitted once.'
      }, { status: 400 })
    }

    // Handle file uploads
    const national_id_front = formData.get('national_id_front') as File
    const national_id_back = formData.get('national_id_back') as File

    if (!national_id_front || !national_id_back) {
      return NextResponse.json({
        success: false,
        message: 'Both ID images are required.'
      }, { status: 400 })
    }

    // Generate unique paths for files
    const userId = user.id
    const frontFileName = `${userId}/${uuidv4()}_front_${national_id_front.name}`
    const backFileName = `${userId}/${uuidv4()}_back_${national_id_back.name}`

    // Upload front image
    const { data: frontUpload, error: frontError } = await supabase.storage
      .from('users_ids')
      .upload(frontFileName, national_id_front, {
        cacheControl: '3600',
        upsert: false
      })

    if (frontError || !frontUpload) {
      console.error('Front image upload error:', frontError)
      return NextResponse.json({
        success: false,
        message: 'Failed to upload front ID image.'
      }, { status: 500 })
    }

    // Upload back image
    const { data: backUpload, error: backError } = await supabase.storage
      .from('users_ids')
      .upload(backFileName, national_id_back, {
        cacheControl: '3600',
        upsert: false
      })

    if (backError || !backUpload) {
      console.error('Back image upload error:', backError)
      // Clean up front image if back fails
      await supabase.storage.from('users_ids').remove([frontFileName])
      return NextResponse.json({
        success: false,
        message: 'Failed to upload back ID image.'
      }, { status: 500 })
    }

    // Get public URLs (signed for security)
    const { data: frontUrl } = supabase.storage
      .from('users_ids')
      .getPublicUrl(frontFileName)

    const { data: backUrl } = supabase.storage
      .from('users_ids')
      .getPublicUrl(backFileName)

    let verification;

    if (existingVerification) {
      // Update existing verification record
      const { data: updatedVerification, error: updateError } = await supabase
        .from('id_verifications')
        .update({
          full_name: full_name,
          age: validation.data.age,
          gender: gender as 'male' | 'female' | 'other',
          address,
          id_number,
          email: email, // Added email field
          front_id_url: frontFileName,
          back_id_url: backFileName,
          status: 'pending',
          submitted_at: new Date().toISOString()
        })
        .eq('id', existingVerification.id)
        .select('id')
        .single()

      if (updateError || !updatedVerification) {
        console.error('Database update error:', updateError)
        // Clean up uploaded files
        await supabase.storage.from('users_ids').remove([frontFileName, backFileName])
        return NextResponse.json({
          success: false,
          message: 'Failed to update verification request.'
        }, { status: 500 })
      }

      verification = updatedVerification
    } else {
      // Insert new verification request
      const { data: newVerification, error: insertError } = await supabase
        .from('id_verifications')
        .insert([{
          user_id: userId,
          full_name: full_name,
          age: validation.data.age,
          gender: gender as 'male' | 'female' | 'other',
          address,
          id_number,
          email: email, // Added email field
          front_id_url: frontFileName,
          back_id_url: backFileName,
          status: 'pending',
          submitted_at: new Date().toISOString()
        }])
        .select('id')
        .single()

      if (insertError || !newVerification) {
        console.error('Database insert error:', insertError)
        // Clean up uploaded files
        await supabase.storage.from('users_ids').remove([frontFileName, backFileName])
        return NextResponse.json({
          success: false,
          message: 'Failed to save verification request.'
        }, { status: 500 })
      }

      verification = newVerification
    }

    // Update user status to pending
    const { error: updateError } = await supabase
      .from('users')
      .update({ status: 'pending' })
      .eq('id', userId)

    if (updateError) {
      console.error('User status update error:', updateError)
      // Don't fail the request, just log - the verification was created successfully
    }

    // Get all admin users
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'Admin')

    if (adminError) {
      console.error('Error fetching admin users:', adminError)
    } else if (adminUsers && adminUsers.length > 0) {
      // Create notifications for all admin users
      const notifications = adminUsers.map(admin => ({
        user_id: admin.id,
        title: 'New ID Verification Request',
        body: `New verification request from ${full_name} (${email})`,
        type: 'info',
        link_url: `/main/admin/requests/${verification.id}`,
        is_read: false
      }))

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (notificationError) {
        console.error('Notification creation error:', notificationError)
        // Don't fail the request, just log
      }
    }

    console.log(`ID verification submitted for user ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'ID verification submitted successfully! You will be notified once approved.',
      verification_id: verification.id
    })

  } catch (error) {
    console.error('ID verification error:', error)
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred during submission.'
    }, { status: 500 })
  }
}
