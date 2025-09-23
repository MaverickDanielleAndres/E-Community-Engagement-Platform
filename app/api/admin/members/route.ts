import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Session found:', session.user.email)

    // First, let's check if the user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', session.user.email)
      .single()

    if (userError) {
      console.error('User fetch error:', userError)
      return NextResponse.json({ error: 'User not found', details: userError }, { status: 404 })
    }

    console.log('User found:', userData)

    // Check if user has community membership
    const { data: communityData, error: communityError } = await supabase
      .from('community_members')
      .select('community_id, role')
      .eq('user_id', userData.id)
      .single()

    let communityId = 'default-community-id' // fallback

    if (communityError) {
      console.log('No community membership found, using default:', communityError)
    } else {
      communityId = communityData.community_id
      console.log('Community found:', communityId)
    }

    // Try to fetch members
    const { data: members, error: membersError } = await supabase
      .from('community_members')
      .select(`
        user_id,
        role,
        joined_at,
        users!inner(
          id,
          name,
          email,
          last_active
        )
      `)
      .eq('community_id', communityId)

    if (membersError) {
      console.error('Members fetch error:', membersError)
      return NextResponse.json({
        error: 'Failed to fetch members',
        details: membersError,
        communityId: communityId
      }, { status: 500 })
    }

    console.log('Members found:', members?.length || 0)

    // Transform the data with proper type handling
    const formattedMembers = members?.map(member => {
      // Handle the case where users might be an array or object
      const user = Array.isArray(member.users) ? member.users[0] : member.users
      return {
        id: user?.id || member.user_id,
        name: user?.name || 'Unknown User',
        email: user?.email || '',
        role: member.role,
        created_at: member.joined_at,
        updated_at: user?.last_active || null,
        status: 'active'
      }
    }) || []

    return NextResponse.json({
      members: formattedMembers,
      total: formattedMembers.length,
      debug: {
        userEmail: session.user.email,
        communityId: communityId,
        membersCount: members?.length || 0
      }
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
