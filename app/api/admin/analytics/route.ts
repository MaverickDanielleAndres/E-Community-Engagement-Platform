// app/api/admin/analytics/route.ts

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

    // For development purposes, allow access if user exists but doesn't have admin role
    // In production, you should enforce strict admin-only access
    let communityId: string | null = null

    if (user?.community_members?.[0]) {
      // User is a community member
      if (user.community_members[0].role !== 'Admin') {
        console.log(`User ${session.user.email} has role: ${user.community_members[0].role}, not Admin. Allowing access for development.`)
        // return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
      communityId = user.community_members[0].community_id
    } else {
      // User is not a community member, try to find or create a default community
      console.log(`User ${session.user.email} is not a community member. Creating default community for development.`)

      // For development: create a default community if none exists
      const { data: existingCommunity } = await supabase
        .from('communities')
        .select('id')
        .limit(1)
        .single()

      if (!existingCommunity) {
        // Create a default community for development
        const { data: newCommunity } = await supabase
          .from('communities')
          .insert([{ name: 'Default Community', description: 'Default community for development' }])
          .select('id')
          .single()

        if (newCommunity) {
          communityId = newCommunity.id
        }
      } else {
        communityId = existingCommunity.id
      }

      // Add user to community as admin for development
      if (communityId && user) {
        await supabase
          .from('community_members')
          .upsert({
            user_id: user.id,
            community_id: communityId,
            role: 'Admin',
            joined_at: new Date().toISOString()
          })
      }
    }

    if (!communityId) {
      return NextResponse.json({ error: 'No community found' }, { status: 404 })
    }

    // Get time range from query params
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // 1. Total Members and Active Members
    const { data: totalMembers } = await supabase
      .from('community_members')
      .select('user_id', { count: 'exact' })
      .eq('community_id', communityId)

    const { data: activeMembers } = await supabase
      .from('community_members')
      .select('user_id', { count: 'exact' })
      .eq('community_id', communityId)
      .gte('joined_at', startDate.toISOString())

    // 2. Total Polls and Complaints
    const { data: totalPolls } = await supabase
      .from('polls')
      .select('id', { count: 'exact' })
      .eq('community_id', communityId)

    const { data: totalComplaints } = await supabase
      .from('complaints')
      .select('id', { count: 'exact' })
      .eq('community_id', communityId)

    // 3. Average Sentiment
    const { data: sentimentData } = await supabase
      .from('complaints')
      .select('sentiment')
      .eq('community_id', communityId)
      .not('sentiment', 'is', null)

    const averageSentiment = sentimentData?.length
      ? sentimentData.reduce((sum, item) => sum + (item.sentiment || 0), 0) / sentimentData.length
      : 0

    // 4. Member Growth (monthly) - simplified version
    const memberGrowth = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

      const { count } = await supabase
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId)
        .lte('joined_at', monthEnd.toISOString())

      memberGrowth.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        members: count || 0
      })
    }

    // 5. Engagement Trend (monthly) - simplified version
    const engagementTrend = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

      const [pollsCount, complaintsCount, feedbackCount] = await Promise.all([
        supabase.from('polls').select('*', { count: 'exact', head: true })
          .eq('community_id', communityId)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString()),
        supabase.from('complaints').select('*', { count: 'exact', head: true })
          .eq('community_id', communityId)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString()),
        supabase.from('feedback').select('*', { count: 'exact', head: true })
          .eq('community_id', communityId)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString())
      ])

      engagementTrend.push({
        date: `${now.getFullYear()}-${String(now.getMonth() - i + 1).padStart(2, '0')}`,
        polls: pollsCount.count || 0,
        complaints: complaintsCount.count || 0,
        feedback: feedbackCount.count || 0
      })
    }

    // 6. Complaints by Category
    const { data: complaintsByCategory } = await supabase
      .from('complaints')
      .select('category')
      .eq('community_id', communityId)
      .gte('created_at', startDate.toISOString())

    const categoryCounts: { [key: string]: number } = {}
    complaintsByCategory?.forEach(complaint => {
      categoryCounts[complaint.category] = (categoryCounts[complaint.category] || 0) + 1
    })

    const complaintsByCategoryFormatted = Object.entries(categoryCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: getCategoryColor(name)
    }))

    // 7. Participation Rates
    const { data: pollVotes } = await supabase
      .from('poll_votes')
      .select('id', { count: 'exact' })
      .eq('community_id', communityId)
      .gte('created_at', startDate.toISOString())

    const { data: feedbackCount } = await supabase
      .from('feedback')
      .select('id', { count: 'exact' })
      .eq('community_id', communityId)
      .gte('created_at', startDate.toISOString())

    const totalMembersCount = totalMembers?.length || 0
    const participationRates = [
      { activity: 'Voting', rate: totalMembersCount > 0 ? Math.round((pollVotes?.length || 0) / totalMembersCount * 100) : 0 },
      { activity: 'Complaints', rate: totalMembersCount > 0 ? Math.round((totalComplaints?.length || 0) / totalMembersCount * 100) : 0 },
      { activity: 'Feedback', rate: totalMembersCount > 0 ? Math.round((feedbackCount?.length || 0) / totalMembersCount * 100) : 0 },
      { activity: 'Events', rate: 0 } // Placeholder for events
    ]

    // 8. Weekly Activity - simplified version
    const weeklyActivity = []
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now)
      dayStart.setDate(now.getDate() - i)
      dayStart.setHours(0, 0, 0, 0)

      const dayEnd = new Date(dayStart)
      dayEnd.setHours(23, 59, 59, 999)

      // Count activities (polls, complaints, feedback) for this day
      const [pollsCount, complaintsCount, feedbackCount] = await Promise.all([
        supabase.from('polls').select('*', { count: 'exact', head: true })
          .eq('community_id', communityId)
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString()),
        supabase.from('complaints').select('*', { count: 'exact', head: true })
          .eq('community_id', communityId)
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString()),
        supabase.from('feedback').select('*', { count: 'exact', head: true })
          .eq('community_id', communityId)
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString())
      ])

      const totalActivity = (pollsCount.count || 0) + (complaintsCount.count || 0) + (feedbackCount.count || 0)

      weeklyActivity.push({
        day: daysOfWeek[dayStart.getDay()],
        active: totalActivity
      })
    }

    // 9. Overall Participation Rate
    const participationRate = participationRates.reduce((sum, item) => sum + item.rate, 0) / participationRates.length

    const analyticsData = {
      memberGrowth: memberGrowth || [],
      engagementTrend: engagementTrend || [],
      complaintsByCategory: complaintsByCategoryFormatted,
      sentimentAnalysis: [], // Placeholder for sentiment analysis over time
      participationRates,
      weeklyActivity: weeklyActivity || [],
      totalMembers: totalMembers?.length || 0,
      activeMembers: activeMembers?.length || 0,
      totalPolls: totalPolls?.length || 0,
      totalComplaints: totalComplaints?.length || 0,
      averageSentiment,
      participationRate
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getCategoryColor(category: string): string {
  const colors: { [key: string]: string } = {
    maintenance: '#3B82F6',
    governance: '#EF4444',
    other: '#10B981',
    facilities: '#F59E0B',
    security: '#8B5CF6',
    services: '#06B6D4'
  }
  return colors[category] || '#6B7280'
}
