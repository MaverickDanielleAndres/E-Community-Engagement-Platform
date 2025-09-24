// @/app/api/admin/members/route.ts
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

    console.log('Session found:', session.user.email)

    // First, let's check if the user exists using admin client
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role')
      .eq('email', session.user.email)
      .single()

    let userId = userData?.id

    // If user doesn't exist, create them using admin client
    if (userError && userError.code === 'PGRST116') { // No rows returned
      console.log('User not found, creating new user...')

      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          email: session.user.email,
          name: session.user.name || session.user.email.split('@')[0],
          role: 'Admin',
          email_verified: new Date().toISOString() // Set email as verified since they're logged in via OAuth
        })
        .select('id, email, name, role')
        .single()

      if (createError) {
        console.error('Failed to create user:', createError)
        return NextResponse.json({
          error: 'Failed to create user',
          details: createError.message
        }, { status: 500 })
      }

      userId = newUser.id
      console.log('Created new user:', newUser)
    } else if (userError) {
      console.error('User fetch error:', userError)
      return NextResponse.json({
        error: 'Failed to fetch user',
        details: userError.message
      }, { status: 500 })
    } else {
      console.log('User found:', userData)
    }

    // Check if user has community membership
    const { data: communityData, error: communityError } = await supabaseAdmin
      .from('community_members')
      .select(`
        community_id, 
        role,
        communities!inner(id, name, code)
      `)
      .eq('user_id', userId)
      .single()

    let communityId = null
    let communityInfo = null

    if (communityError && communityError.code === 'PGRST116') { // No rows returned
      console.log('No community membership found, creating community...')

      // Generate unique community code
      let communityCode = ''
      let counter = 1
      
      while (true) {
        const testCode = `ADMIN${String(counter).padStart(3, '0')}`
        const { data: existing } = await supabaseAdmin
          .from('communities')
          .select('id')
          .eq('code', testCode)
          .single()
        
        if (!existing) {
          communityCode = testCode
          break
        }
        counter++
      }

      // Create new community
      const { data: newCommunity, error: communityCreateError } = await supabaseAdmin
        .from('communities')
        .insert({
          name: `${session.user.name || 'Admin'}'s Community`,
          code: communityCode
        })
        .select('id, name, code')
        .single()

      if (communityCreateError) {
        console.error('Failed to create community:', communityCreateError)
        return NextResponse.json({
          error: 'Failed to create community',
          details: communityCreateError.message
        }, { status: 500 })
      }

      communityId = newCommunity.id
      communityInfo = newCommunity

      // Add user as admin member
      const { error: memberError } = await supabaseAdmin
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: userId,
          role: 'Admin'
        })

      if (memberError) {
        console.error('Failed to add user to community:', memberError)
        return NextResponse.json({
          error: 'Failed to add user to community',
          details: memberError.message
        }, { status: 500 })
      }

      console.log('Created new community:', newCommunity)
    } else if (communityError) {
      console.error('Community membership error:', communityError)
      return NextResponse.json({
        error: 'Failed to fetch community membership',
        details: communityError.message
      }, { status: 500 })
    } else {
      communityId = communityData.community_id
      // Handle the communities data properly
      const communitiesData = Array.isArray(communityData.communities) 
        ? communityData.communities[0] 
        : communityData.communities
      communityInfo = communitiesData
      console.log('Community found:', communityId)
    }

    // Fetch all community members
    const { data: members, error: membersError } = await supabaseAdmin
      .from('community_members')
      .select(`
        id,
        user_id,
        role,
        joined_at,
        users!inner(
          id,
          name,
          email,
          updated_at
        )
      `)
      .eq('community_id', communityId)

    if (membersError) {
      console.error('Members fetch error:', membersError)
      return NextResponse.json({
        error: 'Failed to fetch members',
        details: membersError.message,
        communityId: communityId
      }, { status: 500 })
    }

    console.log('Members found:', members?.length || 0)

    // Transform the data with proper type handling
    const formattedMembers = members?.map(member => {
      const user = Array.isArray(member.users) ? member.users[0] : member.users
      return {
        id: user?.id || member.user_id,
        name: user?.name || 'Unknown User',
        email: user?.email || '',
        role: member.role,
        created_at: member.joined_at,
        updated_at: user?.updated_at || null,
        status: 'active'
      }
    }) || []

    // Count admins and members
    const adminCount = formattedMembers.filter(m => m.role === 'Admin').length
    const memberCount = formattedMembers.length

    return NextResponse.json({
      members: formattedMembers,
      community: communityInfo,
      stats: {
        total: memberCount,
        admins: adminCount,
        residents: memberCount - adminCount
      },
      debug: {
        userEmail: session.user.email,
        userId: userId,
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