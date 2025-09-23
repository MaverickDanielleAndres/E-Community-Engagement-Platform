import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

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

    // Fetch audit log
    const { data: logs, error } = await supabase
      .from('audit_log')
      .select(`
        id,
        action_type,
        entity_type,
        entity_id,
        details,
        created_at,
        ip_address,
        users(name, email)
      `)
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 })
    }

    const formattedLogs = logs?.map(log => ({
      id: log.id,
      action_type: log.action_type,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      user_name: (log.users as any)?.name || 'System',
      details: log.details,
      created_at: log.created_at,
      ip_address: log.ip_address
    })) || []

    return NextResponse.json({ logs: formattedLogs })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
