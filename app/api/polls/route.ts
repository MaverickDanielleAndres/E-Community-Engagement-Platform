// @/app/api/polls/route.ts - Updated
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
      return NextResponse.json({ polls: [] })
    }

    const communityId = user.community_members[0].community_id

    // Fetch polls with vote counts
    const { data: polls, error } = await supabase
      .from('polls')
      .select(`
        id,
        title,
        description,
        deadline,
        created_at,
        is_anonymous,
        is_multi_select
      `)
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })

    // Get vote counts for each poll
    const pollsWithVotes = await Promise.all(
      (polls || []).map(async (poll) => {
        const { count: voteCount } = await supabase
          .from('poll_votes')
          .select('*', { count: 'exact', head: true })
          .eq('poll_id', poll.id)

        return {
          ...poll,
          vote_count: voteCount || 0,
          status: poll.deadline && new Date(poll.deadline) < new Date() ? 'closed' : 'active'
        }
      })
    )

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 })
    }

    return NextResponse.json({ polls: pollsWithVotes })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, deadline, is_anonymous, is_multi_select, options } = body

    if (!title || !options || options.length < 2) {
      return NextResponse.json({
        error: 'Title and at least 2 options are required'
      }, { status: 400 })
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

    // Create poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        community_id: communityId,
        title,
        description,
        deadline: deadline || null,
        is_anonymous: is_anonymous || false,
        is_multi_select: is_multi_select || false,
        created_by: user.id
      })
      .select()
      .single()

    if (pollError) {
      console.error('Poll creation error:', pollError)
      return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 })
    }

    // Create poll options
    const optionsData = options.map((option: string, index: number) => ({
      poll_id: poll.id,
      option_text: option,
      ord: index
    }))

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionsData)

    if (optionsError) {
      console.error('Options creation error:', optionsError)
      // Rollback poll creation
      await supabase.from('polls').delete().eq('id', poll.id)
      return NextResponse.json({ error: 'Failed to create poll options' }, { status: 500 })
    }

    // Log audit trail
    await supabase
      .from('audit_log')
      .insert({
        community_id: communityId,
        user_id: user.id,
        action_type: 'create_poll',
        entity_type: 'poll',
        entity_id: poll.id,
        details: { title, options_count: options.length }
      })

    return NextResponse.json({ poll, message: 'Poll created successfully' })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
