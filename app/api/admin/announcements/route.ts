import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// Use service role client to bypass RLS for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user data
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's community
    const { data: communityData } = await supabaseAdmin
      .from('community_members')
      .select('community_id, role')
      .eq('user_id', userData.id)
      .single()

    if (!communityData) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    // Verify user is admin of the community
    if (communityData.role !== 'Admin') {
      return NextResponse.json({ error: 'Only admins can view announcements' }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '4')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const offset = (page - 1) * limit

    // Build query
    let query = supabaseAdmin
      .from('announcements')
      .select(`
        *,
        creator:users!created_by(id, name, email)
      `, { count: 'exact' })
      .eq('community_id', communityData.community_id)
      .order('created_at', { ascending: false })

    // Apply date filters if provided
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo + 'T23:59:59.999Z') // Include the entire day
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: announcements, error, count } = await query

    if (error) {
      console.error('Error fetching announcements:', error)
      return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      announcements: announcements || [],
      total: count || 0,
      totalPages,
      currentPage: page
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse FormData instead of JSON
    const formData = await request.formData()
    const title = formData.get('title') as string
    const content = formData.get('body') as string  // Changed from 'content' to 'body'
    const image = formData.get('image') as File | null

    // Validate required fields
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Get user data
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's community
    const { data: communityData } = await supabaseAdmin
      .from('community_members')
      .select('community_id, role')
      .eq('user_id', userData.id)
      .single()

    if (!communityData) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    // Verify user is admin of the community
    if (communityData.role !== 'Admin') {
      return NextResponse.json({ error: 'Only admins can create announcements' }, { status: 403 })
    }

    let imageUrl = null

    // Handle image upload if provided
    if (image && image.size > 0) {
      // Validate file type
      if (!image.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 })
      }

      // Validate file size (5MB limit)
      if (image.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'File size too large. Maximum 5MB allowed.' }, { status: 400 })
      }

      try {
        // Upload image to Supabase Storage
        const fileName = `announcement-${Date.now()}-${image.name}`
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('announcement-images')
          .upload(fileName, image, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Error uploading image:', uploadError)
          return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
          .from('announcement-images')
          .getPublicUrl(fileName)

        imageUrl = urlData.publicUrl
      } catch (uploadError) {
        console.error('Image upload error:', uploadError)
        return NextResponse.json({ error: 'Failed to process image upload' }, { status: 500 })
      }
    }

    // Create announcement
    const { data: announcement, error } = await supabaseAdmin
      .from('announcements')
      .insert({
        community_id: communityData.community_id,
        title: title,
        body: content || null,  // Changed from content to body
        image_url: imageUrl,
        created_by: userData.id
      })
      .select(`
        *,
        creator:users!created_by(id, name, email)
      `)
      .single()

    if (error) {
      console.error('Error creating announcement:', error)
      return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
    }

    // Create notifications for all community members (except the creator)
    try {
      // Get all community members except the creator
      const { data: communityMembers, error: membersError } = await supabaseAdmin
        .from('community_members')
        .select('user_id')
        .eq('community_id', communityData.community_id)
        .neq('user_id', userData.id) // Exclude the creator

      if (membersError) {
        console.error('Error fetching community members:', membersError)
        // Don't fail the announcement creation if notification creation fails
      } else if (communityMembers && communityMembers.length > 0) {
        // Create notifications for each member
        const notifications = communityMembers.map(member => ({
          user_id: member.user_id,
          type: 'info',
          title: `New Announcement: ${title}`,
          body: `A new announcement has been posted in your community: ${title}`,
          link_url: '/main/user/announcements',
          is_read: false
        }))

        const { error: notificationError } = await supabaseAdmin
          .from('notifications')
          .insert(notifications)

        if (notificationError) {
          console.error('Error creating notifications:', notificationError)
          // Don't fail the announcement creation if notification creation fails
        }
      }
    } catch (notificationError) {
      console.error('Error in notification creation process:', notificationError)
      // Don't fail the announcement creation if notification creation fails
    }

    return NextResponse.json({ announcement }, { status: 201 })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
