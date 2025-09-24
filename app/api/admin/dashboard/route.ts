// @/app/api/admin/dashboard/route.ts
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

    // For development, allow access without strict authentication
    // In production, uncomment the strict checks below
    /*
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
    */

    // Development mode: allow access for testing
    // In production, use the commented code above

    // For development, use a mock community ID
    const communityId = 'mock-community-id'

    // Get dashboard stats in parallel
    const [
      { count: totalMembers },
      { count: activePolls },
      { count: totalPolls },
      { count: pendingComplaints },
      { count: totalComplaints },
      { count: resolvedComplaints },
      { count: totalFeedback },
      { data: recentComplaints },
      { data: recentPolls },
      { data: recentFeedback },
      { data: feedbackRatings }
    ] = await Promise.all([
      // Total members
      supabase
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId),

      // Active polls (deadline is null or in the future)
      supabase
        .from('polls')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId)
        .or(`deadline.is.null,deadline.gt.${new Date().toISOString()}`),

      // Total polls
      supabase
        .from('polls')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId),

      // Pending complaints
      supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId)
        .eq('status', 'pending'),

      // Total complaints
      supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId),

      // Resolved complaints
      supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId)
        .eq('status', 'resolved'),

      // Total feedback
      supabase
        .from('feedback')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId),

      // Recent complaints
      supabase
        .from('complaints')
        .select(`
          id, title, status, sentiment, created_at,
          users!inner(name, email)
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .limit(5),

      // Recent polls
      supabase
        .from('polls')
        .select('id, title, created_at')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .limit(3),

      // Recent feedback
      supabase
        .from('feedback')
        .select(`
          id, rating, comment, created_at,
          users!inner(name, email)
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .limit(3),

      // Feedback ratings for average
      supabase
        .from('feedback')
        .select('rating')
        .eq('community_id', communityId)
    ])

    // Calculate averages
    const averageRating = feedbackRatings && feedbackRatings.length > 0
      ? feedbackRatings.reduce((sum, f) => sum + f.rating, 0) / feedbackRatings.length
      : 0

    // Get new members this month
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    const { count: newMembersThisMonth } = await supabase
      .from('community_members')
      .select('*', { count: 'exact', head: true })
      .eq('community_id', communityId)
      .gte('joined_at', oneMonthAgo.toISOString())

    // Build activity feed
    const recentActivity: { id: any; type: string; title: any; user: any; timestamp: any; status?: any; priority?: string }[] = []

    // Add complaints to activity
    recentComplaints?.forEach(complaint => {
      const userArray = Array.isArray(complaint.users) ? complaint.users : [complaint.users]
      recentActivity.push({
        id: complaint.id,
        type: 'complaint',
        title: complaint.title,
        user: userArray[0]?.name || 'Anonymous',
        timestamp: complaint.created_at,
        status: complaint.status,
        priority: complaint.sentiment < -0.5 ? 'high' : complaint.sentiment < 0 ? 'medium' : 'low'
      })
    })

    // Add polls to activity
    recentPolls?.forEach(poll => {
      recentActivity.push({
        id: poll.id,
        type: 'poll',
        title: `Poll created: ${poll.title}`,
        user: 'Admin',
        timestamp: poll.created_at,
        status: 'active'
      })
    })

    // Add feedback to activity
    recentFeedback?.forEach(feedback => {
      const userArray = Array.isArray(feedback.users) ? feedback.users : [feedback.users]
      recentActivity.push({
        id: feedback.id,
        type: 'feedback',
        title: `${feedback.rating}-star feedback${feedback.comment ? ': ' + feedback.comment.substring(0, 50) + '...' : ''}`,
        user: userArray[0]?.name || 'Anonymous',
        timestamp: feedback.created_at
      })
    })

    // Sort by timestamp
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Member growth chart data (last 6 months)
    const memberGrowthData = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      const { count } = await supabase
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId)
        .gte('joined_at', monthStart.toISOString())
        .lte('joined_at', monthEnd.toISOString())

      memberGrowthData.push({
        name: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        value: count || 0
      })
    }

    const dashboardData = {
      stats: {
        totalMembers: totalMembers || 0,
        activePolls: activePolls || 0,
        totalPolls: totalPolls || 0,
        pendingComplaints: pendingComplaints || 0,
        totalComplaints: totalComplaints || 0,
        resolvedComplaints: resolvedComplaints || 0,
        totalFeedback: totalFeedback || 0,
        averageRating: parseFloat(averageRating.toFixed(1)),
        newMembersThisMonth: newMembersThisMonth || 0
      },
      recentActivity: recentActivity.slice(0, 10),
      memberGrowthData
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
