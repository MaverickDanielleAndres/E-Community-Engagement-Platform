import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Get user and check community membership
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

    // Fetch individual feedback with user details
    const { data: feedback, error } = await supabase
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
      .eq('id', id)
      .eq('community_id', communityId)
      .single()

    if (error || !feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
    }

    // Enrich feedback with resolved details (same logic as main route)
    let resolved_details = ''
    if (feedback.form_data && typeof feedback.form_data === 'object') {
      // Resolve any UUID values from common entities
      for (const [key, value] of Object.entries(feedback.form_data)) {
        if (typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
          // Try complaints first
          let resolvedText = ''
          const { data: complaint } = await supabase
            .from('complaints')
            .select('description')
            .eq('id', value)
            .single()
          if (complaint?.description) {
            resolvedText = complaint.description
          } else {
            // Then polls
            const { data: poll } = await supabase
              .from('polls')
              .select('question')
              .eq('id', value)
              .single()
            if (poll?.question) {
              resolvedText = poll.question
            }
          }
          if (resolvedText) {
            resolved_details += `${key.charAt(0).toUpperCase() + key.slice(1)}: ${resolvedText}. `
          }
        }
      }

      // Extract non-UUID text fields
      const textEntries = Object.entries(feedback.form_data).filter(
        ([key, val]) => typeof val === 'string' && val.length > 0 && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val)
      )
      for (const [key, val] of textEntries) {
        resolved_details += `${key.charAt(0).toUpperCase() + key.slice(1)}: ${val}. `
      }

      resolved_details = resolved_details.trim() || 'Form data submitted without details'
    } else if (feedback.comment) {
      resolved_details = feedback.comment
    } else {
      resolved_details = 'No details provided'
    }

    // Return feedback with resolved details
    const enrichedFeedback = {
      ...feedback,
      resolved_details
    }

    return NextResponse.json({ feedback: enrichedFeedback })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

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

    // Check if feedback exists and get ownership info
    const { data: feedback } = await supabase
      .from('feedback')
      .select('user_id')
      .eq('id', id)
      .eq('community_id', communityId)
      .single()

    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
    }

    const isOwner = feedback.user_id === user.id
    const isAdmin = user.community_members[0].role?.toLowerCase() === 'admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete the feedback
    const { error: deleteError } = await supabase
      .from('feedback')
      .delete()
      .eq('id', id)

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
        entity_id: id,
        details: { deleted_by: isAdmin ? 'admin' : 'owner' }
      })

    return NextResponse.json({ message: 'Feedback deleted successfully' })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
