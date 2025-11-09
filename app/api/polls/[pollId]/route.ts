//

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pollId } = params

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch poll with questions and responses
    const { data: poll, error } = await supabase
      .from('polls')
      .select(`
        id,
        title,
        description,
        deadline,
        created_at,
        is_anonymous,
        questions,
        footer_note,
        complaint_link
      `)
      .eq('id', pollId)
      .single()

    if (error || !poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    // Get user's existing response
    const { data: userResponse } = await supabase
      .from('poll_responses')
      .select('responses')
      .eq('poll_id', pollId)
      .eq('respondent_id', user.id)
      .maybeSingle()

    // Get all responses for this poll
    const { data: allResponses, error: responsesError } = await supabase
      .from('poll_responses')
      .select('responses')
      .eq('poll_id', pollId)

    if (responsesError) {
      console.error('Error fetching responses:', responsesError)
    }

    // Aggregate responses by question
    const responseMap: { [questionId: string]: any[] } = {}

    if (allResponses) {
      allResponses.forEach((responseRecord: any) => {
        const responses = responseRecord.responses || {}
        Object.entries(responses).forEach(([questionId, answer]) => {
          if (!responseMap[questionId]) {
            responseMap[questionId] = []
          }
          responseMap[questionId].push(answer)
        })
      })
    }

    // Add responses to each question
    const questionsWithStats = poll.questions.map((question: any) => ({
      ...question,
      responses: responseMap[question.id] || []
    }))

    const formattedPoll = {
      ...poll,
      questions: questionsWithStats,
      totalResponses: allResponses?.length || 0,
      user_voted: !!userResponse,
      user_responses: userResponse?.responses || {},
      status: poll.deadline && new Date(poll.deadline) < new Date() ? 'closed' : 'active'
    }

    return NextResponse.json({ poll: formattedPoll })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pollId } = params
    const body = await request.json()

    // First get the poll to find its community
    const { data: pollData } = await supabase
      .from('polls')
      .select('community_id, title')
      .eq('id', pollId)
      .single()

    if (!pollData) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is admin in the poll's community
    const { data: membership } = await supabase
      .from('community_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('community_id', pollData.community_id)
      .single()

    // Check if user is global admin or community admin
    if (!(user.role === 'Admin' || membership?.role === 'Admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Handle manual poll closure - only update deadline, ignore status field
    const { status, ...otherUpdates } = body
    let updateData: any = { ...otherUpdates }
    if (status === 'closed') {
      updateData.deadline = new Date(Date.now() - 5000).toISOString() // 5 seconds ago to ensure closed
      console.log('Closing poll, setting deadline to:', updateData.deadline)

      // Get response count for the poll
      const { count: responseCount } = await supabase
        .from('poll_responses')
        .select('*', { count: 'exact', head: true })
        .eq('poll_id', pollId)

      // Create notification for all admin users
      const { data: adminUsers, error: adminError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'Admin')

      if (adminError) {
        console.error('Error fetching admin users:', adminError)
      } else if (adminUsers && adminUsers.length > 0) {
        // Create notifications for all admin users
        const notifications = adminUsers.map(admin => ({
          user_id: admin.id,
          title: `Poll "${pollData.title}" has been closed`,
          body: `The poll has been manually closed with ${responseCount || 0} responses.`,
          type: 'info',
          link_url: `/main/admin/polls/${pollId}`,
          is_read: false
        }))

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notifications)

        if (notificationError) {
          console.error('Notification creation error:', notificationError)
          // Don't fail the request, just log
        }
      }
    }

    // Update poll
    const { error } = await supabase
      .from('polls')
      .update(updateData)
      .eq('id', pollId)

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: 'Failed to update poll' }, { status: 500 })
    }

    // Log audit trail
    await supabase
      .from('audit_log')
      .insert({
        community_id: pollData.community_id,
        user_id: user.id,
        action_type: 'update_poll',
        entity_type: 'poll',
        entity_id: pollId,
        details: { ...body, status: undefined } // Don't log computed status
      })

    return NextResponse.json({ message: 'Poll updated successfully' })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pollId } = params

    // First get the poll to find its community
    const { data: poll } = await supabase
      .from('polls')
      .select('community_id')
      .eq('id', pollId)
      .single()

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is admin in the poll's community
    const { data: membership } = await supabase
      .from('community_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('community_id', poll.community_id)
      .single()

    // Check if user is global admin or community admin
    if (!(user.role === 'Admin' || membership?.role === 'Admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Delete poll (cascade will handle options and votes)
    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete poll' }, { status: 500 })
    }

    // Log audit trail
    await supabase
      .from('audit_log')
      .insert({
        community_id: poll.community_id,
        user_id: user.id,
        action_type: 'delete_poll',
        entity_type: 'poll',
        entity_id: pollId,
        details: {}
      })

    // Create notifications for all community members
    const { data: members } = await supabase
      .from('community_members')
      .select('user_id')
      .eq('community_id', poll.community_id)

    if (members && members.length > 0) {
      const memberIds = members.map((m: any) => m.user_id)
      const notifications = memberIds.map((memberId: string) => ({
        user_id: memberId,
        type: 'poll_deleted',
        title: 'A poll has been deleted',
        body: 'A poll that was previously available has been removed by the admin.',
        link_url: '/main/user/polls',
        is_read: false,
        created_at: new Date().toISOString()
      }))

      await supabase.from('notifications').insert(notifications)
    }

    return NextResponse.json({ message: 'Poll deleted successfully' })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}