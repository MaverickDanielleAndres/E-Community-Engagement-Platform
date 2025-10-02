import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (userError || !user || user.role !== 'Admin') {
      return NextResponse.json({
        success: false,
        message: 'Access denied'
      }, { status: 403 })
    }

    const requestId = params.requestId

    if (!requestId) {
      return NextResponse.json({
        success: false,
        message: 'Request ID is required'
      }, { status: 400 })
    }

    // Fetch the specific verification request with all details
    const { data: request, error } = await supabase
      .from('id_verifications')
      .select(`
        id,
        user_id,
        full_name,
        age,
        gender,
        address,
        id_number,
        front_id_url,
        back_id_url,
        status,
        submitted_at,
        users!id_verifications_user_id_fkey(email)
      `)
      .eq('id', requestId)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch request'
      }, { status: 500 })
    }

    if (!request) {
      return NextResponse.json({
        success: false,
        message: 'Request not found'
      }, { status: 404 })
    }

    // Generate signed URLs for images
    let frontSignedUrl = null;
    let backSignedUrl = null;

    if (request.front_id_url) {
      const { data: frontSigned, error: frontSignError } = await supabase.storage
        .from('users_ids')
        .createSignedUrl(request.front_id_url, 3600); // 1 hour expiry

      if (!frontSignError) {
        frontSignedUrl = frontSigned.signedUrl;
      } else {
        console.error('Front signed URL error:', frontSignError);
      }
    }

    if (request.back_id_url) {
      const { data: backSigned, error: backSignError } = await supabase.storage
        .from('users_ids')
        .createSignedUrl(request.back_id_url, 3600); // 1 hour expiry

      if (!backSignError) {
        backSignedUrl = backSigned.signedUrl;
      } else {
        console.error('Back signed URL error:', backSignError);
      }
    }

    // Transform the data to match frontend expectations
    const transformedRequest = {
      ...request,
      front_id_url: frontSignedUrl,
      back_id_url: backSignedUrl,
      created_at: request.submitted_at,
      email: request.users?.[0]?.email || ''
    }

    return NextResponse.json({
      success: true,
      request: transformedRequest
    })

  } catch (error) {
    console.error('Verification request detail error:', error)
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred'
    }, { status: 500 })
  }
}
