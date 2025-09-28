// @/app/api/debug/user-role/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createClient } from '@supabase/supabase-js'
import { authOptions } from '../../auth/[...nextauth]/route'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single()

    // Get community member data
    const { data: memberData, error: memberError } = await supabase
      .from('community_members')
      .select(`
        *,
        communities(*)
      `)
      .eq('user_id', userData?.id)

    // Get all communities (for reference)
    const { data: allCommunities } = await supabase
      .from('communities')
      .select('*')

    const debugInfo = {
      session: {
        user: session.user,
        token: session
      },
      database: {
        user: userData,
        userError,
        communityMembers: memberData,
        memberError,
        allCommunities
      },
      analysis: {
        userHasRole: !!userData?.role,
        userRole: userData?.role,
        isCommunityMember: !!memberData && memberData.length > 0,
        communityRole: memberData?.[0]?.role,
        effectiveRole: memberData?.[0]?.role || userData?.role || 'Guest'
      }
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 })
  }
}