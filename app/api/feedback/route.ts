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

    // Enrich feedback with resolved details
    const enrichedFeedback = await Promise.all(
      (feedback || []).map(async (item: any) => {
        if (item.form_data && typeof item.form_data === 'object') {
          let details = '';

          // Resolve any UUID values from common entities
          for (const [key, value] of Object.entries(item.form_data)) {
            if (typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
              // Try complaints first
              let resolvedText = '';
              const { data: complaint } = await supabase
                .from('complaints')
                .select('description')
                .eq('id', value)
                .single();
              if (complaint?.description) {
                resolvedText = complaint.description;
              } else {
                // Then polls
                const { data: poll } = await supabase
                  .from('polls')
                  .select('question')
                  .eq('id', value)
                  .single();
                if (poll?.question) {
                  resolvedText = poll.question;
                }
              }
              if (resolvedText) {
                details += `${key.charAt(0).toUpperCase() + key.slice(1)}: ${resolvedText}. `;
              }
            }
          }

          // Extract non-UUID text fields
          const textEntries = Object.entries(item.form_data).filter(
            ([key, val]) => typeof val === 'string' && val.length > 0 && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val)
          );
          for (const [key, val] of textEntries) {
            details += `${key.charAt(0).toUpperCase() + key.slice(1)}: ${val}. `;
          }

          item.resolved_details = details.trim() || 'Form data submitted without details';
        } else if (item.comment) {
          item.resolved_details = item.comment;
        } else {
          item.resolved_details = 'No details provided';
        }

        return item;
      })
    );

    return NextResponse.json({ feedback: enrichedFeedback })
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

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const feedbackId = searchParams.get('id')

    if (!feedbackId) {
      return NextResponse.json({ error: 'Feedback ID is required' }, { status: 400 })
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

    // Check if user is admin or the feedback owner
    const { data: feedback } = await supabase
      .from('feedback')
      .select('user_id')
      .eq('id', feedbackId)
      .eq('community_id', communityId)
      .single()

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
    }

    const isOwner = feedback.user_id === user.id
    const isAdmin = user.community_members[0].role === 'Admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete the feedback
    const { error: deleteError } = await supabase
      .from('feedback')
      .delete()
      .eq('id', feedbackId)

    if (deleteError) {
      console.error('Feedback deletion error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete feedback' }, { status: 500 })
    }

    // Log audit trail
    await supabase
      .from('audit_log')
      .insert({
        community_id: communityId,
        user_id: user.id,
        action_type: 'delete_feedback',
        entity_type: 'feedback',
        entity_id: feedbackId,
        details: { deleted_by: isAdmin ? 'admin' : 'owner' }
      })

    return NextResponse.json({ message: 'Feedback deleted successfully' })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
