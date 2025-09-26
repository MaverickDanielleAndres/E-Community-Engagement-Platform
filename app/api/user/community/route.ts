import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSupabaseServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseServerClient()

    // Get user's community_id from user_roles view
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('community_id')
      .eq('email', session.user.email)
      .single()

    if (roleError || !(userRole as any)?.community_id) {
      return NextResponse.json({ error: 'User community not found' }, { status: 404 })
    }

    // Get community member count
    const { count, error: countError } = await supabase
      .from('community_members')
      .select('*', { count: 'exact', head: true })
      .eq('community_id', (userRole as any).community_id)

    if (countError) {
      console.error('Error counting community members:', countError)
      return NextResponse.json({ error: 'Failed to fetch member count' }, { status: 500 })
    }

    return NextResponse.json({ members: count || 0 })
  } catch (error) {
    console.error('Error in user community API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
