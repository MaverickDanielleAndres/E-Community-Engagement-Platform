
// @/app/api/complaints/route.ts - Updated
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createClient } from '@supabase/supabase-js'
import { authOptions } from '@/lib/auth'

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
        resolution_message,
        media_urls,
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

    // Parse multipart form data
    const formData = await request.formData()
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = (formData.get('category') as string) || 'other'

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
        category,
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

    // Handle media uploads
    const mediaUrls: string[] = []
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('media_') && value instanceof File) {
        const file = value
        const fileExt = file.name.split('.').pop()
        const fileName = `complaint-media/${complaint.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('complaint-media')
          .upload(fileName, file)

        if (uploadError) {
          console.error('File upload error:', uploadError)
          continue
        }

        const { data: publicUrlData } = supabase.storage
          .from('complaint-media')
          .getPublicUrl(fileName)

        if (publicUrlData?.publicUrl) {
          mediaUrls.push(publicUrlData.publicUrl)
        }
      }
    }

    // Update complaint with media URLs if any
    if (mediaUrls.length > 0) {
      const { error: updateError } = await supabase
        .from('complaints')
        .update({ media_urls: mediaUrls })
        .eq('id', complaint.id)

      if (updateError) {
        console.error('Failed to update complaint with media URLs:', updateError)
      }
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

    // Notify all admin users
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'Admin')

    if (adminError) {
      console.error('Error fetching admin users:', adminError)
    } else if (adminUsers && adminUsers.length > 0) {
      // Create notifications for all admin users
      const notifications = adminUsers.map(admin => ({
        user_id: admin.id,
        title: 'New Complaint Submitted',
        body: `A new complaint titled "${title}" has been submitted.`,
        type: 'info',
        link_url: '/main/admin/complaints',
        is_read: false
      }))

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (notificationError) {
        console.error('Notification creation error:', notificationError)
        // Don't fail the request, just log
      }
    }

    return NextResponse.json({ complaint, message: 'Complaint submitted successfully' })
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
    const clearAll = searchParams.get('clear_all') === 'true'

    if (!clearAll) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
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

    // Delete all complaints for this user in this community
    const { error: deleteError } = await supabase
      .from('complaints')
      .delete()
      .eq('user_id', user.id)
      .eq('community_id', communityId)

    if (deleteError) {
      console.error('Delete complaints error:', deleteError)
      return NextResponse.json({ error: 'Failed to clear complaints' }, { status: 500 })
    }

    // Log audit trail
    await supabase
      .from('audit_log')
      .insert({
        community_id: communityId,
        user_id: user.id,
        action_type: 'clear_all_complaints',
        entity_type: 'complaint',
        entity_id: null,
        details: { action: 'cleared_all_user_complaints' }
      })

    return NextResponse.json({ message: 'All complaints cleared successfully' })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
