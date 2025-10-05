// @/app/api/admin/members/[id]/route.ts
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    const { role } = body

    // Get admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select(`
        id,
        community_members!inner(
          community_id,
          role
        )
      `)
      .eq('email', session.user.email)
      .single()

    if (adminError || !adminUser || !adminUser.community_members?.[0] || adminUser.community_members[0].role !== 'Admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const communityId = adminUser.community_members[0].community_id

    // Update member role
    const { error } = await supabase
      .from('community_members')
      .update({ role })
      .eq('user_id', id)
      .eq('community_id', communityId)

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: 'Failed to update member role' }, { status: 500 })
    }

    // Log audit trail
    await supabase
      .from('audit_log')
      .insert({
        community_id: communityId,
        user_id: adminUser.id,
        action_type: 'update_member_role',
        entity_type: 'user',
        entity_id: id,
        details: { new_role: role }
      })

    // Create notification for the affected user
    const notifications = [{
      user_id: id,
      type: 'role_changed',
      title: 'Your role has been updated',
      body: `Your role in the community has been changed to ${role}.`,
      link_url: '/main/user',
      is_read: false,
      created_at: new Date().toISOString()
    }]

    await supabase.from('notifications').insert(notifications)

    return NextResponse.json({ message: 'Member role updated successfully' })
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

    // Get admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select(`
        id,
        community_members!inner(
          community_id,
          role
        )
      `)
      .eq('email', session.user.email)
      .single()

    if (adminError || !adminUser || !adminUser.community_members?.[0] || adminUser.community_members[0].role !== 'Admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const communityId = adminUser.community_members[0].community_id

    // First delete any id_verification records for this user
    const { error: idVerificationError } = await supabase
      .from('id_verifications')
      .delete()
      .eq('user_id', id)

    if (idVerificationError) {
      console.error('Failed to delete id_verification records:', idVerificationError)
      // Don't fail the entire operation if this fails, just log it
    }

    // Then remove member from community
    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('user_id', id)
      .eq('community_id', communityId)

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
    }

    // Finally delete the user from users table to completely remove them
    const { error: userDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (userDeleteError) {
      console.error('Failed to delete user from users table:', userDeleteError)
      // Don't fail the entire operation if this fails, just log it
      // The user is still removed from the community, which is the main goal
    }

    // Also delete all sessions for this user to remove active sessions
    const { error: sessionDeleteError } = await supabase
      .from('sessions')
      .delete()
      .eq('user_id', id)

    if (sessionDeleteError) {
      console.error('Failed to delete user sessions:', sessionDeleteError)
      // Don't fail the entire operation if this fails, just log it
    }

    // Log audit trail
    await supabase
      .from('audit_log')
      .insert({
        community_id: communityId,
        user_id: adminUser.id,
        action_type: 'remove_member',
        entity_type: 'user',
        entity_id: id,
        details: {}
      })

    return NextResponse.json({ message: 'Member removed successfully' })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}