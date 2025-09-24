import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
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
    const { optionIds } = body

    if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
      return NextResponse.json({ error: 'Option selection required' }, { status: 400 })
    }

    // Get user
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

    // Get poll details
    const { data: poll } = await supabase
      .from('polls')
      .select('id, deadline, is_multi_select, community_id')
      .eq('id', pollId)
      .single()

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    // Check if poll is closed
    if (poll.deadline && new Date(poll.deadline) < new Date()) {
      return NextResponse.json({ error: 'Poll is closed' }, { status: 400 })
    }

    // Check if user belongs to poll's community
    if (poll.community_id !== user.community_members[0].community_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check multi-select constraint
    if (!poll.is_multi_select && optionIds.length > 1) {
      return NextResponse.json({ error: 'Multiple selections not allowed' }, { status: 400 })
    }

    // Remove existing votes
    await supabase
      .from('poll_votes')
      .delete()
      .eq('poll_id', pollId)
      .eq('voter_id', user.id)

    // Cast new votes
    const votes = optionIds.map((optionId: string) => ({
      poll_id: pollId,
      option_id: optionId,
      voter_id: user.id
    }))

    const { error: voteError } = await supabase
      .from('poll_votes')
      .insert(votes)

    if (voteError) {
      console.error('Vote error:', voteError)
      return NextResponse.json({ error: 'Failed to cast vote' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Vote cast successfully' })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}