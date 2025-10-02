// @/app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    if (!user || user.community_members?.[0]?.role !== 'Admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const communityId = user.community_members[0].community_id

    // Get community settings
    const { data: community, error } = await supabase
      .from('communities')
      .select('*')
      .eq('id', communityId)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // For now, return basic community info. We can expand this later with more settings
    const settings = {
      community_id: communityId,
      name: community.name,
      description: community.description || '',
      code: community.code,
      logo_url: community.logo_url || '',
      // Default settings for features not yet in DB
      allow_guest_access: true,
      require_approval: false,
      auto_archive_polls: true,
      enable_ai_insights: true,
      notification_settings: {
        email_notifications: true,
        push_notifications: true,
        daily_digest: false,
        weekly_summary: true
      },
      ai_settings: {
        sentiment_analysis: true,
        anomaly_detection: true,
        auto_categorization: true,
        chatbot_enabled: true
      }
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Settings API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, code, logo_url } = body

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

    if (!user || user.community_members?.[0]?.role !== 'Admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const communityId = user.community_members[0].community_id

    // Update community settings
    const { data: updatedCommunity, error } = await supabase
      .from('communities')
      .update({
        name,
        description,
        code,
        logo_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', communityId)
      .select('id, name, description, code, logo_url, updated_at')
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    // Log audit trail
    await supabase
      .from('audit_log')
      .insert({
        community_id: communityId,
        user_id: user.id,
        action_type: 'update_community_settings',
        entity_type: 'community',
        entity_id: communityId,
        details: { name, description, code, logo_url }
      })

    return NextResponse.json({ message: 'Settings updated successfully', community: updatedCommunity })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type')
    let updateData: any = { updated_at: new Date().toISOString() }
    let logoUrl: string | null = null

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

    if (!user || user.community_members?.[0]?.role !== 'Admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const communityId = user.community_members[0].community_id

    if (contentType?.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData()
      const imageFile = formData.get('image') as File

      if (imageFile) {
        // Upload to Supabase Storage
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `logos/${communityId}-${Date.now()}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('community-image')
          .upload(fileName, imageFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError || !uploadData) {
          console.error('Storage upload error:', uploadError)
          return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('community-image')
          .getPublicUrl(fileName)

        updateData.logo_url = publicUrl
        logoUrl = publicUrl
      }
    } else {
      // Handle JSON data for other settings
      const body = await request.json()
      const { name, code, description } = body

      if (name !== undefined) updateData.name = name
      if (description !== undefined) updateData.description = description
      if (code !== undefined) updateData.code = code
      if (logoUrl) updateData.logo_url = logoUrl
    }

    // Update community settings
    const { data: updatedCommunity, error } = await supabase
      .from('communities')
      .update(updateData)
      .eq('id', communityId)
      .select('id, name, description, code, logo_url, updated_at')
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    // Log audit trail
    await supabase
      .from('audit_log')
      .insert({
        community_id: communityId,
        user_id: user.id,
        action_type: 'update_community_settings',
        entity_type: 'community',
        entity_id: communityId,
        details: updateData
      })

    const response: any = { message: 'Settings updated successfully', community: updatedCommunity }
    if (logoUrl) {
      response.logoUrl = logoUrl
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
