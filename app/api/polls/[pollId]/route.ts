//

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
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
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pollId } = params

    // Fetch poll with options and vote counts
    const { data: poll, error } = await supabase
      .from('polls')
      .select(`
        id,
        title,
        description,
        deadline,
        created_at,
        is_anonymous,
        is_multi_select,
        poll_options(
          id,
          option_text,
          poll_votes(count)
        )
      `)
      .eq('id', pollId)
      .single()

    if (error || !poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    // Format the data
    const options = poll.poll_options.map(option => ({
      id: option.id,
      option_text: option.option_text,
      vote_count: option.poll_votes?.length || 0
    }))

    const total_votes = options.reduce((sum, option) => sum + option.vote_count, 0)

    const formattedPoll = {
      ...poll,
      options,
      total_votes,
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
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pollId } = params
    const body = await request.json()

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

    // Update poll
    const { error } = await supabase
      .from('polls')
      .update(body)
      .eq('id', pollId)

    if (error) {
      return NextResponse.json({ error: 'Failed to update poll' }, { status: 500 })
    }

    // Log audit trail
    await supabase
      .from('audit_log')
      .insert({
        community_id: poll.community_id,
        user_id: user.id,
        action_type: 'update_poll',
        entity_type: 'poll',
        entity_id: pollId,
        details: body
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
    const session = await getServerSession()

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

    return NextResponse.json({ message: 'Poll deleted successfully' })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}