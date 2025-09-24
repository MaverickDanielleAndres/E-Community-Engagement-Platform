
// @/app/api/complaints/route.ts - Updated
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const my = searchParams.get('my') === 'true'

    // Get user's community
    const { data: user } = await supabase
      .from('users')
      .select(`
        id,
        community_members(
          community_id,
          role
        )
      `)
      .eq('email', session.user.email)
      .single()

    if (!user || !user.community_members?.[0]) {
      return NextResponse.json({ complaints: [] })
    }

    const communityId = user.community_members[0].community_id
    
    // Build query
    let query = supabase
      .from('complaints')
      .select(`
        id,
        title,
        description,
        category,
        status,
        priority,
        sentiment,
        created_at,
        updated_at,
        users(name, email)
      `)
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    
    if (category) {
      query = query.eq('category', category)
    }
    
    if (my) {
      query = query.eq('user_id', user.id)
    }

    const { data: complaints, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 })
    }

    return NextResponse.json({ complaints: complaints || [] })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, category } = body

    if (!title || !description) {
      return NextResponse.json({ 
        error: 'Title and description are required' 
      }, { status: 400 })
    }

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select(`
        id,
        community_members(
          community_id,
          role
        )
      `)
      .eq('email', session.user.email)
      .single()

    if (!user || !user.community_members?.[0]) {
      return NextResponse.json({ error: 'Community membership required' }, { status: 403 })
    }

    const communityId = user.community_members[0].community_id

    // Analyze sentiment (mock for now - replace with actual AI service)
    let sentiment = 0
    try {
      const sentimentResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/ai/sentiment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `${title} ${description}` })
      })
      
      if (sentimentResponse.ok) {
        const sentimentData = await sentimentResponse.json()
        sentiment = sentimentData.sentiment || 0
      }
    } catch (error) {
      console.error('Sentiment analysis failed:', error)
    }

    // Create complaint
    const { data: complaint, error: complaintError } = await supabase
      .from('complaints')
      .insert({
        community_id: communityId,
        user_id: user.id,
        title,
        description,
        category: category || 'other',
        status: 'pending',
        priority: 0,
        sentiment
      })
      .select()
      .single()

    if (complaintError) {
      console.error('Complaint creation error:', complaintError)
      return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 })
    }

    // Log audit trail
    await supabase
      .from('audit_log')
      .insert({
        community_id: communityId,
        user_id: user.id,
        action_type: 'create_complaint',
        entity_type: 'complaint',
        entity_id: complaint.id,
        details: { title, category }
      })

    return NextResponse.json({ complaint, message: 'Complaint submitted successfully' })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}