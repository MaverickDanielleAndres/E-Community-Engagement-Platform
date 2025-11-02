import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSupabaseServerClient } from '@/lib/supabase'
import { messagingMiddleware } from '@/lib/messaging-middleware'
import { MessageCache } from '@/lib/message-cache'
import { z } from 'zod'

const addReactionSchema = z.object({
  reaction: z.string().min(1).max(10)
})

// Type definitions for Supabase tables
type Message = {
  id: string
  conversation_id: string
  conversation_participants: { id: string }[]
}

type MessageReaction = {
  id: string
  message_id: string
  user_id: string
  reaction: string
  created_at: string
  users?: { name: string }
}

type AuditLog = {
  actor_id: string
  action: string
  target_table: string
  target_id: string
  payload: Record<string, unknown>
  created_at?: string
}

type User = {
  id: string
  name: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return messagingMiddleware(request, async () => {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

    const messageId = params.id
    const body = await request.json()
    const { reaction } = addReactionSchema.parse(body)

    const supabase = getSupabaseServerClient()

    // First, get the message and check if it exists and not deleted
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .select('id, conversation_id')
      .eq('id', messageId)
      .is('deleted_at', null)
      .single()

    if (msgError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Then, check if user is participant in the conversation
    const { data: participant, error: partError } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', (message as any).conversation_id)
      .eq('user_id', session.user.id)
      .single()

    if (partError || !participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if reaction already exists
    const { data: existingReaction, error: checkError } = await (supabase as any)
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', session.user.id)
      .eq('reaction', reaction)
      .single()

    if (existingReaction) {
      // Remove existing reaction (toggle behavior)
      const { error: deleteError } = await (supabase as any)
        .from('message_reactions')
        .delete()
        .eq('id', existingReaction.id)

      if (deleteError) {
        console.error('Error removing reaction:', deleteError)
        return NextResponse.json({ error: 'Failed to remove reaction' }, { status: 500 })
      }

      // Log audit event
      await (supabase as any).from('audit_logs').insert({
        actor_id: session.user.id,
        action: 'remove_reaction',
        target_table: 'message_reactions',
        target_id: existingReaction.id,
        payload: { message_id: messageId, reaction }
      })

      // Update cache
      const cache = MessageCache.getInstance()
      cache.updateMessageReaction((message as any).conversation_id, messageId, session.user.id, reaction, 'remove')

      return NextResponse.json({ message: 'Reaction removed' })
    } else {
      // Check if user already has a different reaction on this message
      const { data: userReactions, error: userCheckError } = await (supabase as any)
        .from('message_reactions')
        .select('id, reaction')
        .eq('message_id', messageId)
        .eq('user_id', session.user.id)

      if (userCheckError) {
        console.error('Error checking user reactions:', userCheckError)
        return NextResponse.json({ error: 'Failed to check existing reactions' }, { status: 500 })
      }

      // Remove any existing reactions from this user on this message
      if (userReactions && userReactions.length > 0) {
        const { error: removeOldError } = await (supabase as any)
          .from('message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', session.user.id)

        if (removeOldError) {
          console.error('Error removing old reactions:', removeOldError)
          return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 })
        }
      }
      // Add new reaction
      const { data: insertResult, error: insertError } = await (supabase as any)
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: session.user.id,
          reaction: reaction
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('Error adding reaction:', insertError)
        return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 })
      }

      const { data: newReaction, error: selectError } = await (supabase as any)
        .from('message_reactions')
        .select(`
          id,
          reaction,
          created_at,
          users!user_id(name)
        `)
        .eq('id', (insertResult as any).id)
        .single()

      if (selectError) {
        console.error('Error fetching reaction:', selectError)
        return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 })
      }

      // Log audit event
      await (supabase as any).from('audit_logs').insert({
        actor_id: session.user.id,
        action: 'add_reaction',
        target_table: 'message_reactions',
        target_id: (newReaction as any).id,
        payload: { message_id: messageId, reaction }
      })

      const formattedReaction = {
        id: (newReaction as any).id,
        reaction: (newReaction as any).reaction,
        userId: session.user.id,
        userName: (newReaction as any).users?.name,
        createdAt: (newReaction as any).created_at
      }

      // Update cache
      const cache = MessageCache.getInstance()
      cache.updateMessageReaction((message as any).conversation_id, messageId, session.user.id, reaction, 'add', formattedReaction)

      return NextResponse.json({ reaction: formattedReaction }, { status: 201 })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }

    console.error('Error in reactions POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return messagingMiddleware(request, async () => {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

    const messageId = params.id
    const supabase = getSupabaseServerClient()

    // First, get the message and check if it exists and not deleted
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .select('id, conversation_id')
      .eq('id', messageId)
      .is('deleted_at', null)
      .single()

    if (msgError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Then, check if user is participant in the conversation
    const { data: participant, error: partError } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', (message as any).conversation_id)
      .eq('user_id', session.user.id)
      .single()

    if (partError || !participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get reactions for the message
    const { data: reactions, error: reactionsError } = await (supabase as any)
      .from('message_reactions')
      .select(`
        id,
        reaction,
        created_at,
        user_id,
        users!user_id(name)
      `)
      .eq('message_id', messageId)
      .order('created_at', { ascending: true })

    if (reactionsError) {
      console.error('Error fetching reactions:', reactionsError)
      return NextResponse.json({ error: 'Failed to fetch reactions' }, { status: 500 })
    }

    const formattedReactions = (reactions as any)?.map((r: any) => ({
      id: r.id,
      reaction: r.reaction,
      userId: r.user_id,
      userName: r.users?.name,
      createdAt: r.created_at
    })) || []

    return NextResponse.json({ reactions: formattedReactions })
  } catch (error) {
    console.error('Error in reactions GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
  })
}
