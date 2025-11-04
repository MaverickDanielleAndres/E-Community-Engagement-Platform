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
        admin_response,
        admin_response_at,
        admin_response_by,
        users(name, email),
        admin_user:admin_response_by(name)
      `)
      .eq('id', id)
      .eq('community_id', communityId)
      .single()

    if (error || !feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
    }

    // Fetch the template for this feedback, or active if template_id is null
    let templateQuery = supabase
      .from('feedback_form_templates')
      .select('fields');

    if (feedback.template_id) {
      templateQuery = templateQuery.eq('id', feedback.template_id);
    } else {
      templateQuery = templateQuery.eq('community_id', communityId).eq('is_active', true);
    }

    const { data: template } = await templateQuery.single();

    // Build mapping from field id to label
    const fieldIdToLabel: Record<string, string> = {};
    if (template?.fields && Array.isArray(template.fields)) {
      for (const field of template.fields) {
        if (field.id && field.label) {
          fieldIdToLabel[field.id] = field.label;
        }
      }
    }

    // Enrich feedback with resolved details
    let resolved_details = ''
    if (feedback.form_data && typeof feedback.form_data === 'object') {
      // Resolve any UUID values from common entities
      for (const [key, value] of Object.entries(feedback.form_data)) {
        const label = fieldIdToLabel[key] || key.charAt(0).toUpperCase() + key.slice(1);
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
            resolved_details += `${label}: ${resolvedText}. `
          }
        } else if (typeof value === 'string' && value.length > 0) {
          resolved_details += `${label}: ${value}. `
        }
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { admin_response } = body

    if (!admin_response || typeof admin_response !== 'string' || admin_response.trim().length === 0) {
      return NextResponse.json({ error: 'Admin response is required' }, { status: 400 })
    }

    // Get user and check if admin
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
    const isAdmin = user.community_members[0].role?.toLowerCase() === 'admin'

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Check if feedback exists
    const { data: existingFeedback } = await supabase
      .from('feedback')
      .select('id, user_id')
      .eq('id', id)
      .eq('community_id', communityId)
      .single()

    if (!existingFeedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
    }

    // Update feedback with admin response
    const { data: updatedFeedback, error: updateError } = await supabase
      .from('feedback')
      .update({
        admin_response: admin_response.trim(),
        admin_response_at: new Date().toISOString(),
        admin_response_by: user.id
      })
      .eq('id', id)
      .eq('community_id', communityId)
      .select(`
        id,
        rating,
        comment,
        form_data,
        template_id,
        created_at,
        admin_response,
        admin_response_at,
        admin_response_by,
        users(name, email),
        admin_user:admin_response_by(name)
      `)
      .single()

    if (updateError) {
      console.error('Feedback update error:', updateError)
      return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 })
    }

    // Create notification for the user who submitted the feedback
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: existingFeedback.user_id,
        type: 'feedback_response',
        title: 'Admin Response to Your Feedback',
        body: `An admin has responded to your feedback: "${admin_response.substring(0, 100)}${admin_response.length > 100 ? '...' : ''}"`,
        link_url: `/main/feedback/my/${id}`
      })

    if (notificationError) {
      console.error('Notification creation error:', notificationError)
      // Don't fail the request if notification fails
    }

    // Log audit trail
    await supabase
      .from('audit_log')
      .insert({
        community_id: communityId,
        user_id: user.id,
        action_type: 'respond_to_feedback',
        entity_type: 'feedback',
        entity_id: id,
        details: { response_length: admin_response.length }
      })

    return NextResponse.json({ feedback: updatedFeedback, message: 'Response added successfully' })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
