// @/app/api/admin/members/route.ts
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

    if (!user || user.community_members?.[0]?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const communityId = user.community_members[0].community_id

    // Fetch all community members with user details
    const { data: members, error } = await supabase
      .from('community_members')
      .select(`
        id,
        role,
        joined_at,
        users(
          id,
          name,
          email,
          created_at,
          updated_at
        )
      `)
      .eq('community_id', communityId)
      .order('joined_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
    }

    // Format the data
    const formattedMembers = members?.map(member => ({
      id: member.users.id,
      name: member.users.name || 'Unknown',
      email: member.users.email,
      role: member.role,
      joined_at: member.joined_at,
      last_active: member.users.updated_at, // Using updated_at as last_active proxy
      status: 'active' // You can add actual status logic based on your needs
    })) || []

    return NextResponse.json({ members: formattedMembers })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// @/app/api/admin/members/[id]/route.ts
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { role } = body

    // Get admin user
    const { data: adminUser } = await supabase
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

    if (!adminUser || adminUser.community_members?.[0]?.role !== 'admin') {
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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Get admin user
    const { data: adminUser } = await supabase
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

    if (!adminUser || adminUser.community_members?.[0]?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const communityId = adminUser.community_members[0].community_id

    // Remove member from community
    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('user_id', id)
      .eq('community_id', communityId)

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
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