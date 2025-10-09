import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { UpdateAnnouncementRequest } from "@/types/announcement"

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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const announcementId = params.id

    const { data: announcement, error } = await supabaseAdmin
      .from('announcements')
      .select(`
        *,
        creator:users!created_by(id, name, email)
      `)
      .eq('id', announcementId)
      .single()

    if (error) {
      console.error('Error fetching announcement:', error)
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    return NextResponse.json({ announcement })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const announcementId = params.id

    // Parse FormData instead of JSON
    const formData = await request.formData()
    const title = formData.get('title') as string
    const content = formData.get('content') as string
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

    // Verify user is admin of the announcement's community
    const { data: announcement } = await supabaseAdmin
      .from('announcements')
      .select('community_id')
      .eq('id', announcementId)
      .single()

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    const { data: membershipData } = await supabaseAdmin
      .from('community_members')
      .select('role')
      .eq('user_id', userData.id)
      .eq('community_id', announcement.community_id)
      .single()

    if (!membershipData || membershipData.role !== 'Admin') {
      return NextResponse.json({ error: 'Only admins can update announcements' }, { status: 403 })
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

    // Prepare update data
    const updateData: any = {
      title: title,
      body: content || null
    }

    // Only update image_url if a new image was uploaded
    if (imageUrl !== null) {
      updateData.image_url = imageUrl
    }

    // Update announcement
    const { data: updatedAnnouncement, error } = await supabaseAdmin
      .from('announcements')
      .update(updateData)
      .eq('id', announcementId)
      .select(`
        *,
        creator:users!created_by(id, name, email)
      `)
      .single()

    if (error) {
      console.error('Error updating announcement:', error)
      return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 })
    }

    return NextResponse.json({ announcement: updatedAnnouncement })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const announcementId = params.id

    // Get user data
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify user is admin of the announcement's community
    const { data: announcement } = await supabaseAdmin
      .from('announcements')
      .select('community_id')
      .eq('id', announcementId)
      .single()

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    const { data: membershipData } = await supabaseAdmin
      .from('community_members')
      .select('role')
      .eq('user_id', userData.id)
      .eq('community_id', announcement.community_id)
      .single()

    if (!membershipData || membershipData.role !== 'Admin') {
      return NextResponse.json({ error: 'Only admins can delete announcements' }, { status: 403 })
    }

    // Delete announcement
    const { error } = await supabaseAdmin
      .from('announcements')
      .delete()
      .eq('id', announcementId)

    if (error) {
      console.error('Error deleting announcement:', error)
      return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Announcement deleted' })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
