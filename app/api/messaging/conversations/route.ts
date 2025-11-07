import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSupabaseServerClient } from '@/lib/supabase'
import { messagingMiddleware } from '@/lib/messaging-middleware'
import { z } from 'zod'

const createConversationSchema = z.object({
  participantIds: z.array(z.string().uuid()).min(1).max(1), // Only 1:1 conversations for now
  title: z.string().optional(),
})

export async function GET(request: NextRequest) {
  return messagingMiddleware(request, async () => {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

    const supabase = getSupabaseServerClient()

    // Get user's community
    const { data: userCommunity, error: communityError } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', session.user.id)
      .single()

    if (communityError || !userCommunity) {
      return NextResponse.json({ error: 'User not in community' }, { status: 403 })
    }

    // Get conversation IDs where user is a participant
    const { data: userConversations, error: userConvError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', session.user.id)

    if (userConvError) {
      console.error('Error fetching user conversations:', userConvError)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    const conversationIds = userConversations?.map((c: any) => c.conversation_id) || []

    if (conversationIds.length === 0) {
      return NextResponse.json({ conversations: [] })
    }

    // Get conversations with all participants
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        title,
        is_group,
        created_at,
        last_message_at,
        conversation_participants(user_id, users(id, name, image, status)),
        messages(id, body, created_at, sender_id, users!messages_sender_id_fkey(name, image))
      `)
      .eq('community_id', (userCommunity as any).community_id)
      .in('id', conversationIds)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (convError) {
      console.error('Error fetching conversations:', convError)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    // Calculate unread counts for each conversation
    const conversationsWithUnreadCounts = await Promise.all((conversations || []).map(async (conv: any) => {
      // Count unread messages: messages not sent by user and not in message_reads
      const { count: unreadCount, error: unreadError } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .neq('sender_id', session.user.id)
        .not('message_reads', 'cs', `{"user_id": "${session.user.id}"}`)

      if (unreadError) {
        console.error('Error fetching unread count for conversation:', conv.id, unreadError)
      }

      return {
        ...conv,
        unreadCount: unreadCount || 0
      }
    }))

    // Format the response
    const formattedConversations = conversationsWithUnreadCounts?.map((conv: any) => ({
      id: conv.id,
      title: conv.title,
      isGroup: conv.is_group,
      lastMessageAt: conv.last_message_at,
      unreadCount: conv.unreadCount,
      participants: conv.conversation_participants?.map((p: any) => ({
        id: p.users.id,
        name: p.users.name,
        image: p.users.image,
        status: p.users.status
      })) || [],
      lastMessage: conv.messages?.[0] ? {
        id: conv.messages[0].id,
        body: conv.messages[0].body,
        createdAt: conv.messages[0].created_at,
        sender: conv.messages[0].users ? {
          id: conv.messages[0].sender_id,
          name: conv.messages[0].users.name,
          avatarUrl: conv.messages[0].users.image
        } : null
      } : null
    })) || []

    return NextResponse.json({ conversations: formattedConversations })
    } catch (error) {
      console.error('Error in conversations GET:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return messagingMiddleware(request, async () => {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

    const body = await request.json()
    const { participantIds, title } = createConversationSchema.parse(body)

    const supabase = getSupabaseServerClient()

    // Get user's community
    const { data: userCommunity, error: communityError } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', session.user.id)
      .single()

    if (communityError || !userCommunity) {
      return NextResponse.json({ error: 'User not in community' }, { status: 403 })
    }

    // Check if target user is in the same community and not an admin
    const { data: targetUser, error: targetError } = await supabase
      .from('community_members')
      .select(`
        user_id,
        role
      `)
      .eq('community_id', (userCommunity as any).community_id)
      .eq('user_id', participantIds[0])
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json({ error: 'Target user not found in community' }, { status: 404 })
    }

    if ((targetUser as any).role === 'Admin') {
      return NextResponse.json({ error: 'Cannot message administrators' }, { status: 403 })
    }

    // Check if conversation already exists
    // First get conversation IDs for the target user
    const { data: targetUserConversations, error: targetConvError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', participantIds[0])

    if (targetConvError) {
      console.error('Error fetching target user conversations:', targetConvError)
      return NextResponse.json({ error: 'Failed to check existing conversations' }, { status: 500 })
    }

    const conversationIds = targetUserConversations?.map((c: any) => c.conversation_id) || []

    const { data: existingConv, error: existingError } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversations!inner(id)
      `)
      .eq('user_id', session.user.id)
      .in('conversation_id', conversationIds)

    if (existingConv && existingConv.length > 0) {
      return NextResponse.json({
        conversation: { id: (existingConv[0] as any).conversation_id }
      })
    }

    // Create new conversation
    const { data: conversation, error: convError } = await (supabase as any)
      .from('conversations')
      .insert({
        community_id: (userCommunity as any).community_id,
        is_group: false,
        title: title,
        created_by: session.user.id
      })
      .select()
      .single()

    if (convError) {
      console.error('Error creating conversation:', convError)
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    // Add participants
    const participants = [
      { conversation_id: (conversation as any).id, user_id: session.user.id },
      { conversation_id: (conversation as any).id, user_id: participantIds[0] }
    ]

    const { error: partError } = await (supabase as any)
      .from('conversation_participants')
      .insert(participants)

    if (partError) {
      console.error('Error adding participants:', partError)
      // Clean up conversation if participants failed
      await supabase.from('conversations').delete().eq('id', (conversation as any).id)
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    // Log audit event
    await (supabase as any).from('audit_logs').insert({
      actor_id: session.user.id,
      action: 'create_conversation',
      target_table: 'conversations',
      target_id: (conversation as any).id,
      payload: { participant_ids: participantIds }
    })

    return NextResponse.json({ conversation: { id: (conversation as any).id } }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
      }

      console.error('Error in conversations POST:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
