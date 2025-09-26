import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSupabaseServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const recent = searchParams.get('recent')

    const supabase = getSupabaseServerClient()

    // Get user's community_id from user_roles view
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('community_id')
      .eq('email', session.user.email)
      .single()

    if (roleError || !(userRole as any)?.community_id) {
      return NextResponse.json({ error: 'User community not found' }, { status: 404 })
    }

    // Build query for user's feedback in their community
    let query = supabase
      .from('feedback')
      .select(`
        id,
        rating,
        comment,
        form_data,
        created_at,
        user_email
      `)
      .eq('community_id', (userRole as any).community_id)
      .eq('user_email', session.user.email)
      .order('created_at', { ascending: false })

    if (recent === 'true') {
      // Get feedback from last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      query = query.gte('created_at', thirtyDaysAgo.toISOString())
    }

    const { data: feedback, error } = await query

    if (error) {
      console.error('Error fetching user feedback:', error)
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
    }

    return NextResponse.json({ feedback: feedback || [] })
  } catch (error) {
    console.error('Error in user feedback API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { rating, comment, form_data } = body

    if (rating === undefined || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    // Get user's community_id from user_roles view
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('community_id')
      .eq('email', session.user.email)
      .single()

    if (roleError || !(userRole as any)?.community_id) {
      return NextResponse.json({ error: 'User community not found' }, { status: 404 })
    }

    // Create feedback
    const { data: feedback, error } = await supabase
      .from('feedback')
      .insert({
        rating,
        comment,
        form_data,
        user_email: session.user.email,
        community_id: (userRole as any).community_id
      } as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating feedback:', error)
      return NextResponse.json({ error: 'Failed to create feedback' }, { status: 500 })
    }

    return NextResponse.json({ feedback }, { status: 201 })
  } catch (error) {
    console.error('Error in user feedback POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
