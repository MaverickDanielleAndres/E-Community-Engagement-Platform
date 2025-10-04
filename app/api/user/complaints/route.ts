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
    const status = searchParams.get('status')

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

    // Build query for user's complaints in their community
    let query = supabase
      .from('complaints')
      .select(`
        id,
        title,
        description,
        status,
        priority,
        category,
        created_at,
        updated_at,
        user_email,
        resolution_message
      `)
      .eq('community_id', (userRole as any).community_id)
      .eq('user_email', session.user.email)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: complaints, error } = await query

    if (error) {
      console.error('Error fetching user complaints:', error)
      return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 })
    }

    return NextResponse.json({ complaints: complaints || [] })
  } catch (error) {
    console.error('Error in user complaints API:', error)
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
    const { title, description, category, priority = 'medium' } = body

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
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

    // Create complaint
    const { data: complaint, error } = await supabase
      .from('complaints')
      .insert({
        title,
        description,
        category,
        priority,
        user_email: session.user.email,
        community_id: (userRole as any).community_id,
        status: 'open'
      } as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating complaint:', error)
      return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 })
    }

    return NextResponse.json({ complaint }, { status: 201 })
  } catch (error) {
    console.error('Error in user complaints POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
