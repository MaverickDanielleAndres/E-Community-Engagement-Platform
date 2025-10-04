// @/app/api/polls/route.ts - Updated for multi-question polls
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface PollQuestion {
  id: string
  type: 'radio' | 'checkbox' | 'text'
  question: string
  options?: string[]
  required: boolean
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
      return NextResponse.json({ polls: [] })
    }

    const communityId = user.community_members[0].community_id

    // Fetch polls with response counts
    const { data: polls, error } = await supabase
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
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })

    // Get response counts and user_voted for each poll
    const pollsWithResponses = await Promise.all(
      (polls || []).map(async (poll) => {
        const { count: responseCount } = await supabase
          .from('poll_responses')
          .select('*', { count: 'exact', head: true })
          .eq('poll_id', poll.id)

        const { data: userResponse } = await supabase
          .from('poll_responses')
          .select('id')
          .eq('poll_id', poll.id)
          .eq('user_id', user.id)
          .maybeSingle()

        return {
          ...poll,
          vote_count: responseCount || 0,
          user_voted: !!userResponse,
          status: poll.deadline && new Date(poll.deadline) < new Date() ? 'closed' : 'active'
        }
      })
    )

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 })
    }

    return NextResponse.json({ polls: pollsWithResponses })
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
    const { title, description, deadline, is_anonymous, questions, footer_note, complaint_link } = body

    if (!title || !questions || questions.length === 0) {
      return NextResponse.json({
        error: 'Title and at least 1 question are required'
      }, { status: 400 })
    }

    // Validate questions
    const validationErrors: string[] = []
    questions.forEach((question: PollQuestion, index: number) => {
      if (!question.question?.trim()) {
        validationErrors.push(`Question ${index + 1} is required`)
      }
      if (question.type === 'radio' && (!question.options || question.options.length < 2)) {
        validationErrors.push(`Question ${index + 1} must have at least 2 options`)
      }
    })

    if (validationErrors.length > 0) {
      return NextResponse.json({
        error: 'Validation errors',
        details: validationErrors
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

    if (!user || user.community_members?.[0]?.role !== 'Admin') {
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
        is_multi_select: false, // Not used in new system
        questions: questions,
        footer_note: footer_note || null,
        complaint_link: complaint_link || '/main/complaints',
        created_by: user.id
      })
      .select()
      .single()

    if (pollError) {
      console.error('Poll creation error:', pollError)
      return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 })
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
        details: { title, questions_count: questions.length }
      })


    return NextResponse.json({ poll, message: 'Poll created successfully' })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}