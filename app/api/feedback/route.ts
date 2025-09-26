// @/app/api/feedback/route.ts - Updated to support new form structure
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
    const my = searchParams.get('my') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

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
      return NextResponse.json({ feedback: [] })
    }

    const communityId = user.community_members[0].community_id
    
    // Build query
    let query = supabase
      .from('feedback')
      .select(`
        id,
        rating,
        comment,
        form_data,
        template_id,
        created_at,
        users(name, email)
      `)
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply filters
    if (my) {
      query = query.eq('user_id', user.id)
    }

    const { data: feedback, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
    }

    return NextResponse.json({ feedback: feedback || [] })
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
    const { rating, comment, form_data, template_id } = body

    // Validate rating if provided (backwards compatibility)
    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json({ 
        error: 'Rating must be between 1 and 5' 
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

    // Create feedback entry
    const feedbackData: any = {
      community_id: communityId,
      user_id: user.id,
    }

    // Handle new form data structure or legacy rating/comment
    if (form_data && template_id) {
      feedbackData.form_data = form_data
      feedbackData.template_id = template_id
      
      // Extract rating from form data if it exists for backwards compatibility
      const ratingField = Object.values(form_data).find((value: any) => 
        typeof value === 'number' && value >= 1 && value <= 5
      )
      if (ratingField) {
        feedbackData.rating = ratingField
      }
      
      // Extract comment from form data if it exists
      const commentField = Object.values(form_data).find((value: any) => 
        typeof value === 'string' && value.length > 10
      )
      if (commentField) {
        feedbackData.comment = commentField
      }
    } else {
      // Legacy support for old rating/comment structure
      if (rating) feedbackData.rating = rating
      if (comment) feedbackData.comment = comment
    }

    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .insert(feedbackData)
      .select()
      .single()

    if (feedbackError) {
      console.error('Feedback creation error:', feedbackError)
      return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
    }

    // Log audit trail
    await supabase
      .from('audit_log')
      .insert({
        community_id: communityId,
        user_id: user.id,
        action_type: 'create_feedback',
        entity_type: 'feedback',
        entity_id: feedback.id,
        details: { 
          has_form_data: !!form_data,
          has_rating: !!feedbackData.rating,
          has_comment: !!feedbackData.comment 
        }
      })

    return NextResponse.json({ feedback, message: 'Feedback submitted successfully' })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}