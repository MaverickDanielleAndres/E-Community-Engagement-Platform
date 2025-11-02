import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'Admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseServerClient()

    // Fetch all verification requests from id_verifications table
    const { data: history, error } = await supabase
      .from('id_verifications')
      .select(`
        id,
        user_id,
        full_name,
        address,
        submitted_at,
        reviewed_at,
        approved_at,
        status,
        email
      `)
      .order('submitted_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch history' },
        { status: 500 }
      )
    }

    // Transform the data to match frontend expectations
    const transformedHistory = (history || []).map((request: any) => ({
      id: request.id,
      user_id: request.user_id,
      full_name: request.full_name,
      address: request.address,
      created_at: request.submitted_at,
      reviewed_at: request.reviewed_at,
      approved_at: request.approved_at,
      status: request.status,
      email: request.email || ''
    }))

    return NextResponse.json({
      success: true,
      history: transformedHistory
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
