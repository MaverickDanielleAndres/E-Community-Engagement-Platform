import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface DashboardStats {
  activePolls: number
  openComplaints: number
  recentFeedback: number
  unreadNotifications: number
  communityMembers: number
}

interface RecentActivity {
  title: string
  type: 'poll' | 'complaint' | 'feedback' | 'notification'
  date: string
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's community
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

    if (!user || !user.community_members?.[0]) {
      return NextResponse.json({ error: 'Community membership required' }, { status: 403 })
    }

    const communityId = user.community_members[0].community_id
    const userId = user.id

    // Fetch stats
    const [pollsRes, complaintsRes, feedbackRes, notificationsRes, membersRes] = await Promise.all([
      // Active polls in community
      supabase
        .from('polls')
        .select('id', { count: 'exact' })
        .eq('community_id', communityId)
        .eq('status', 'active'),
      
      // User's open complaints
      supabase
        .from('complaints')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'open'),
      
      // User's recent feedback (last 7 days)
      supabase
        .from('feedback')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      
      // User's unread notifications
      supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('read', false),
      
      // Community members count
      supabase
        .from('community_members')
        .select('id', { count: 'exact', head: true })
        .eq('community_id', communityId)
    ])

    const stats: DashboardStats = {
      activePolls: pollsRes.count || 0,
      openComplaints: complaintsRes.count || 0,
      recentFeedback: feedbackRes.count || 0,
      unreadNotifications: notificationsRes.count || 0,
      communityMembers: membersRes.count || 0
    }

    // Fetch recent activity from audit_log (last 7 days, community-wide)
    const { data: auditLogs } = await supabase
      .from('audit_log')
      .select(`
        created_at,
        action_type,
        entity_type,
        entity_id,
        details,
        users!audit_log_user_id_fkey(name)
      `)
      .eq('community_id', communityId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5)

    const recentActivity: RecentActivity[] = await Promise.all(auditLogs?.map(async (log: any) => {
      let title = ''
      let type: RecentActivity['type'] = 'notification'

      const userName = Array.isArray(log.users) ? (log.users[0] as any)?.name || 'User' : (log.users as any)?.name || 'User'

      switch (log.action_type) {
        case 'create_poll':
          // Fetch poll question for better title
          const { data: poll } = await supabase
            .from('polls')
            .select('question')
            .eq('id', log.entity_id)
            .single()
          title = `New poll: ${poll?.question || 'Untitled Poll'}`
          type = 'poll'
          break
        case 'create_complaint':
          // Fetch complaint description snippet
          const { data: complaint } = await supabase
            .from('complaints')
            .select('description')
            .eq('id', log.entity_id)
            .single()
          title = `Complaint submitted: ${complaint?.description?.substring(0, 50) || 'New Complaint'}... by ${userName}`
          type = 'complaint'
          break
        case 'create_feedback':
          title = `Feedback submitted by ${userName}`
          type = 'feedback'
          break
        case 'update_complaint':
          title = `Complaint #${log.entity_id} updated`
          type = 'complaint'
          break
        default:
          title = `${log.action_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} by ${userName}`
          type = 'notification'
      }

      const date = new Date(log.created_at).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })

      return { title, type, date }
    }) || [])


    return NextResponse.json({ stats, recentActivity })
  } catch (error) {
    console.error('Dashboard fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
