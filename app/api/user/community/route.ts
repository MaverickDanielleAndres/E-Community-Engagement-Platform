import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSupabaseServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseServerClient()

    // Get user's community membership
    const { data: memberData, error: memberError } = await supabase
      .from('community_members')
      .select(`
        community_id,
        communities (
          name,
          created_at
        )
      `)
      .eq('user_id', session.user.id)
      .single()

    if (memberError || !memberData) {
      return NextResponse.json({ error: 'User community not found' }, { status: 404 })
    }

    const communityId = (memberData as any).community_id
    const community = (memberData as any).communities

    // Get community member count
    const { count, error: countError } = await supabase
      .from('community_members')
      .select('*', { count: 'exact', head: true })
      .eq('community_id', communityId)

    if (countError) {
      console.error('Error counting community members:', countError)
      return NextResponse.json({ error: 'Failed to fetch member count' }, { status: 500 })
    }

    return NextResponse.json({
      name: community?.name || 'Unknown Community',
      memberCount: count || 0,
      createdAt: community?.created_at || new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in user community API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
