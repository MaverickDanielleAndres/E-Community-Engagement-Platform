// @/app/api/me/summary/route.ts
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
    console.log('=== API /me/summary called ===')
    
    const session = await getServerSession(authOptions)
    console.log('Session in API:', session)
    
    if (!session?.user?.email) {
      console.log('No session or email found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // FIX: Specify which foreign key to use to avoid ambiguity
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        role,
        community_members!community_members_user_id_fkey(
          community_id,
          role,
          communities(name)
        )
      `)
      .eq('email', session.user.email)
      .single()

    console.log('User query result:', user, userError)

    if (!user) {
      console.log('User not found in database')
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Determine the user's role priority: community_member role > user table role
    let userRole = user.role || 'Guest'
    let communityId = null
    let communityName = null

    console.log('User table role:', user.role)
    console.log('Community members:', user.community_members)

    if (user.community_members && user.community_members.length > 0) {
      // User is a community member, use community role
      const communityMember = user.community_members[0]
      userRole = communityMember.role
      communityId = communityMember.community_id
communityName = communityMember.communities[0]?.name
      console.log('Using community role:', userRole)
    } else {
      console.log('No community membership found, using user table role:', userRole)
    }

    let stats = {
      totalMembers: 0,
      activePolls: 0,
      myPolls: 0,
      openComplaints: 0,
      myComplaints: 0,
      myVotes: 0,
      totalFeedback: 0,
      satisfactionIndex: 0
    }

    if (communityId) {
      // Get community-specific stats
      const [
        { count: totalMembers },
        { count: activePolls },
        { count: myPolls },
        { count: openComplaints },
        { count: myComplaints },
        { count: myVotes },
        { count: totalFeedback }
      ] = await Promise.all([
        supabase
          .from('community_members')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', communityId),
        
        supabase
          .from('polls')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', communityId)
          .or('deadline.is.null,deadline.gt.' + new Date().toISOString()),
        
        supabase
          .from('polls')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', communityId)
          .eq('created_by', user.id),
        
        supabase
          .from('complaints')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', communityId)
          .neq('status', 'resolved'),
        
        supabase
          .from('complaints')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        supabase
          .from('poll_votes')
          .select('*', { count: 'exact', head: true })
          .eq('voter_id', user.id),
        
        supabase
          .from('feedback')
          .select('*', { count: 'exact', head: true })
          .eq('community_id', communityId)
      ])

      // Calculate satisfaction index from feedback
      const { data: feedbackData } = await supabase
        .from('feedback')
        .select('rating')
        .eq('community_id', communityId)

      const averageRating = feedbackData && feedbackData.length > 0 
        ? feedbackData.reduce((sum: number, f: any) => sum + f.rating, 0) / feedbackData.length
        : 0

      stats = {
        totalMembers: totalMembers || 0,
        activePolls: activePolls || 0,
        myPolls: myPolls || 0,
        openComplaints: openComplaints || 0,
        myComplaints: myComplaints || 0,
        myVotes: myVotes || 0,
        totalFeedback: totalFeedback || 0,
        satisfactionIndex: Number(averageRating.toFixed(1))
      }
    }

    // Get recent activity for dashboard
    let recentActivity: any[] = []
    if (communityId) {
      const { data: activityData } = await supabase
        .from('audit_log')
        .select(`
          id,
          action_type,
          entity_type,
          created_at,
          details,
          users(name)
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .limit(10)

      recentActivity = activityData || []
    }

    const summary = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: userRole, // This is the key fix - using the determined role
        community: communityName || 'No Community'
      },
      stats,
      recentActivity: recentActivity.map((activity: any) => ({
        id: activity.id,
        type: activity.action_type,
        entity: activity.entity_type,
        user: activity.users?.name || 'System',
        timestamp: activity.created_at,
        details: activity.details
      }))
    }

    console.log('Final summary response:', summary)
    return NextResponse.json(summary)
  } catch (error) {
    console.error('Server error in /api/me/summary:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}