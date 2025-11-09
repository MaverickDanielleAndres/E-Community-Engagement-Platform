import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSupabaseServerClient } from '@/lib/supabase'
import { messagingMiddleware } from '@/lib/messaging-middleware'
import { z } from 'zod'

const createConversationSchema = z.object({
  participantIds: z.array(z.string().uuid()).min(1).max(10), // Allow up to 10 participants for group chats
  title: z.string().optional(),
  isGroup: z.boolean().optional(),
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

    let conversationIds = userConversations?.map((c: any) => c.conversation_id) || []

    // Ensure user has a default conversation with admin
    const { data: adminUser, error: adminError } = await supabase
      .from('community_members')
      .select('user_id, users(id, name, image)')
      .eq('community_id', (userCommunity as any).community_id)
      .eq('role', 'Admin')
      .single()

    if (adminError || !adminUser) {
      console.error('Error fetching admin user:', adminError)
    } else {
      // Check if user already has a conversation with admin
      const { data: adminConversation, error: adminConvError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', (adminUser as any).user_id)
        .in('conversation_id', conversationIds)

      if (adminConvError) {
        console.error('Error checking admin conversation:', adminConvError)
      } else if (!adminConversation || adminConversation.length === 0) {
        // Create default conversation with admin
        const { data: newConversation, error: newConvError } = await supabase
          .from('conversations')
          .insert({
            community_id: (userCommunity as any).community_id,
            is_group: false,
            title: 'Admin',
            created_by: session.user.id
          })
          .select()
          .single()

        if (newConvError) {
          console.error('Error creating admin conversation:', newConvError)
        } else {
          // Add participants
          const participants = [
            { conversation_id: (newConversation as any).id, user_id: session.user.id },
            { conversation_id: (newConversation as any).id, user_id: (adminUser as any).user_id }
          ]

          const { error: partError } = await supabase
            .from('conversation_participants')
            .insert(participants)

          if (partError) {
            console.error('Error adding participants to admin conversation:', partError)
            // Clean up conversation if participants failed
            await supabase.from('conversations').delete().eq('id', (newConversation as any).id)
          } else {
            // Add to conversation IDs
            conversationIds.push((newConversation as any).id)
          }
        }
      }
    }

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

    // Sort conversations with Admin conversation always at the top
    formattedConversations.sort((a, b) => {
      if (a.title === 'Admin') return -1
      if (b.title === 'Admin') return 1
      return 0 // Keep existing order for others
    })

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
    const { participantIds, title, isGroup } = createConversationSchema.parse(body)

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

    // Determine if this is a group chat
    const isGroupChat = isGroup || participantIds.length > 1

    // Check if all target users are in the same community
    // Allow admins to message members, but prevent members from messaging admins
    for (const participantId of participantIds) {
      const { data: targetUser, error: targetError } = await supabase
        .from('community_members')
        .select(`
          user_id,
          role
        `)
        .eq('community_id', (userCommunity as any).community_id)
        .eq('user_id', participantId)
        .single()

      if (targetError || !targetUser) {
        return NextResponse.json({ error: `User ${participantId} not found in community` }, { status: 404 })
      }

      // Only prevent non-admin users from messaging admins
      if ((targetUser as any).role === 'Admin' && (userCommunity as any).role !== 'Admin') {
        return NextResponse.json({ error: 'Cannot message administrators' }, { status: 403 })
      }
    }

    // For 1:1 conversations, check if conversation already exists
    if (!isGroupChat) {
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
    }

    // Create new conversation
    const { data: conversation, error: convError } = await (supabase as any)
      .from('conversations')
      .insert({
        community_id: (userCommunity as any).community_id,
        is_group: isGroupChat,
        title: title,
        created_by: session.user.id
      })
      .select()
      .single()

    if (convError) {
      console.error('Error creating conversation:', convError)
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    // Add participants (including the creator)
    const participants = [
      { conversation_id: (conversation as any).id, user_id: session.user.id },
      ...participantIds.map(id => ({ conversation_id: (conversation as any).id, user_id: id }))
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

    // Fetch the created conversation with participants
    const { data: createdConversation, error: fetchError } = await supabase
      .from('conversations')
      .select(`
        id,
        title,
        is_group,
        created_at,
        last_message_at,
        conversation_participants(user_id, users(id, name, image, status))
      `)
      .eq('id', (conversation as any).id)
      .single()

    if (fetchError) {
      console.error('Error fetching created conversation:', fetchError)
      // Clean up conversation if fetch failed
      await supabase.from('conversations').delete().eq('id', (conversation as any).id)
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    // Format the response like the GET route
    const formattedConversation = {
      id: createdConversation.id,
      title: createdConversation.title,
      isGroup: createdConversation.is_group,
      lastMessageAt: createdConversation.last_message_at,
      unreadCount: 0,
      participants: createdConversation.conversation_participants?.map((p: any) => ({
        id: p.users.id,
        name: p.users.name,
        image: p.users.image,
        status: p.users.status
      })) || [],
      lastMessage: null
    }

    // Log audit event
    await (supabase as any).from('audit_logs').insert({
      actor_id: session.user.id,
      action: 'create_conversation',
      target_table: 'conversations',
      target_id: (conversation as any).id,
      payload: { participant_ids: participantIds, is_group: isGroupChat }
    })

    return NextResponse.json({ conversation: formattedConversation }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
      }

      console.error('Error in conversations POST:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
