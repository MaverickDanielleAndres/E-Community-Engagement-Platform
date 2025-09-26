// @/app/api/admin/feedback-form/route.ts
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
      return NextResponse.json({ error: 'Community membership required' }, { status: 403 })
    }

    const communityId = user.community_members[0].community_id

    // Get active feedback form template
    const { data: template, error } = await supabase
      .from('feedback_form_templates')
      .select('*')
      .eq('community_id', communityId)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 })
    }

    if (!template) {
      // Return default template if none exists
      const defaultTemplate = {
        id: '',
        title: 'Client Satisfaction Form',
        subtitle: 'Your feedback helps us improve our services',
        fields: [
          {
            id: 'rating',
            type: 'rating',
            label: 'How satisfied are you with our service?',
            required: true,
            options: {
              max: 5,
              emojis: ['😡', '😞', '😐', '😊', '😄'],
              labels: ['Very Poor', 'Poor', 'Good', 'Very Good', 'Excellent']
            }
          },
          {
            id: 'comment',
            type: 'textarea',
            label: 'Comments/Suggestions/Feedback?',
            required: false,
            placeholder: 'Please share your thoughts...'
          }
        ]
      }
      return NextResponse.json({ template: defaultTemplate })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, subtitle, fields } = body

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
      return NextResponse.json({ error: 'Community membership required' }, { status: 403 })
    }

    const communityId = user.community_members[0].community_id

    const templateData = {
      community_id: communityId,
      title: title || 'Client Satisfaction Form',
      subtitle: subtitle || 'Your feedback helps us improve our services',
      fields: fields || [],
      is_active: true,
      updated_at: new Date().toISOString()
    }

    let result
    if (id) {
      // Update existing template
      const { data, error } = await supabase
        .from('feedback_form_templates')
        .update(templateData)
        .eq('id', id)
        .eq('community_id', communityId)
        .select()
        .single()

      if (error) {
        console.error('Update error:', error)
        return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
      }
      result = data
    } else {
      // Create new template
      const { data, error } = await supabase
        .from('feedback_form_templates')
        .insert(templateData)
        .select()
        .single()

      if (error) {
        console.error('Insert error:', error)
        return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
      }
      result = data
    }

    // Log audit trail
    await supabase
      .from('audit_log')
      .insert({
        community_id: communityId,
        user_id: user.id,
        action_type: id ? 'update_feedback_template' : 'create_feedback_template',
        entity_type: 'feedback_form_template',
        entity_id: result.id,
        details: { title: result.title }
      })

    return NextResponse.json({ template: result, message: 'Template saved successfully' })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
