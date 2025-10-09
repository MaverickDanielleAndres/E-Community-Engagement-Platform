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

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const announcementId = params.id
    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' }, { status: 400 })
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size too large. Maximum 5MB allowed.' }, { status: 400 })
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
      return NextResponse.json({ error: 'Only admins can upload images' }, { status: 403 })
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${announcementId}-${Date.now()}.${fileExt}`
    const filePath = `announcement-images/${fileName}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('announcement-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading image:', uploadError)
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('announcement-images')
      .getPublicUrl(filePath)

    // Update announcement with image URL
    const { data: updatedAnnouncement, error: updateError } = await supabaseAdmin
      .from('announcements')
      .update({ image_url: publicUrl })
      .eq('id', announcementId)
      .select(`
        *,
        creator:users!created_by(id, name, email)
      `)
      .single()

    if (updateError) {
      console.error('Error updating announcement:', updateError)
      // Try to delete the uploaded file if update fails
      await supabaseAdmin.storage
        .from('announcement-images')
        .remove([filePath])
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
