// @/app/api/polls/[pollId]/respond/route.ts - New API for submitting poll responses
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
    const { responses } = body

    if (!responses || typeof responses !== 'object') {
      return NextResponse.json({ error: 'Invalid response format' }, { status: 400 })
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
      .select('id, deadline, questions, community_id')
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

    // Validate responses against poll questions
    const validationErrors: string[] = []
    
    poll.questions.forEach((question: any) => {
      const response = responses[question.id]
      
      if (question.required && (!response || response.trim() === '')) {
        validationErrors.push(`Question "${question.question}" is required`)
      }
      
      if (question.type === 'radio' && response) {
        if (!question.options?.includes(response)) {
          validationErrors.push(`Invalid option for question "${question.question}"`)
        }
      }
    })

    if (validationErrors.length > 0) {
      return NextResponse.json({
        error: 'Validation errors',
        details: validationErrors
      }, { status: 400 })
    }

    // Check if user has already responded
    const { data: existingResponse } = await supabase
      .from('poll_responses')
      .select('id')
      .eq('poll_id', pollId)
      .eq('respondent_id', user.id)
      .single()

    if (existingResponse) {
      // Update existing response
      const { error: updateError } = await supabase
        .from('poll_responses')
        .update({
          responses: responses,
          submitted_at: new Date().toISOString()
        })
        .eq('id', existingResponse.id)

      if (updateError) {
        console.error('Update error:', updateError)
        return NextResponse.json({ error: 'Failed to update response' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Response updated successfully' })
    } else {
      // Create new response
      const { error: insertError } = await supabase
        .from('poll_responses')
        .insert({
          poll_id: pollId,
          respondent_id: user.id,
          responses: responses
        })

      if (insertError) {
        console.error('Insert error:', insertError)
        return NextResponse.json({ error: 'Failed to submit response' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Response submitted successfully' })
    }
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}