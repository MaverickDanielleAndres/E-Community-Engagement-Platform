import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSupabaseServerClient } from '@/lib/supabase'
import { messagingMiddleware } from '@/lib/messaging-middleware'

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

      const conversationId = params.id
      const supabase = getSupabaseServerClient()

      // Verify user is a participant in this conversation
      const { data: participant, error: participantError } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', session.user.id)
        .single()

      if (participantError || !participant) {
        return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 })
      }

      // Get conversation details
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id, title, is_group, color, created_at, is_default')
        .eq('id', conversationId)
        .single()

      if (convError) {
        console.error('Error fetching conversation:', convError)
        return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 })
      }

      return NextResponse.json(conversation)
    } catch (error) {
      console.error('Error in conversation GET:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return messagingMiddleware(request, async () => {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const conversationId = params.id
      const body = await request.json()
      const { title, color } = body

      const supabase = getSupabaseServerClient()

      // Get user's role in the community
      const { data: userCommunity, error: communityError } = await supabase
        .from('community_members')
        .select('role')
        .eq('user_id', session.user.id)
        .single()

      if (communityError || !userCommunity) {
        return NextResponse.json({ error: 'User not in community' }, { status: 403 })
      }

      const isAdmin = (userCommunity as any).role === 'Admin'

      if (!isAdmin) {
        return NextResponse.json({ error: 'Only admins can update conversation settings' }, { status: 403 })
      }

      // Update conversation
      const updateData: Record<string, any> = {}
      if (title !== undefined) updateData.title = title
      if (color !== undefined) updateData.color = color

      const { error: updateError } = await (supabase as any)
        .from('conversations')
        .update(updateData)
        .eq('id', conversationId)

      if (updateError) {
        console.error('Error updating conversation:', updateError)
        return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 })
      }

      // Broadcast refresh to all clients viewing this conversation
      await supabase.channel('refresh').send({
        type: 'broadcast',
        event: 'refresh',
        payload: { conversationId }
      })

      return NextResponse.json({ message: 'Conversation updated successfully' })
    } catch (error) {
      console.error('Error in conversation PUT:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return messagingMiddleware(request, async () => {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const conversationId = params.id
      const supabase = getSupabaseServerClient()

      // Get user's role in the community
      const { data: userCommunity, error: communityError } = await supabase
        .from('community_members')
        .select('role')
        .eq('user_id', session.user.id)
        .single()

      if (communityError || !userCommunity) {
        return NextResponse.json({ error: 'User not in community' }, { status: 403 })
      }

      const isAdmin = (userCommunity as any).role === 'Admin'

      // Check if this is a default conversation (Admin or Group Chat)
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('is_default, title')
        .eq('id', conversationId)
        .single()

      if (convError) {
        console.error('Error fetching conversation:', convError)
        return NextResponse.json({ error: 'Failed to fetch conversation details' }, { status: 500 })
      }

      if ((conversation as any).is_default) {
        return NextResponse.json({ error: 'Cannot delete default conversations (Admin or Group Chat)' }, { status: 403 })
      }

      if (isAdmin) {
        // Admin can fully delete the conversation and all its messages

        // Get all messages in the conversation before deletion
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('id')
          .eq('conversation_id', conversationId)

        // Hard delete all messages in the conversation
        if (messages && messages.length > 0) {
          const { error: deleteMessagesError } = await (supabase as any)
            .from('messages')
            .delete()
            .eq('conversation_id', conversationId)

          if (deleteMessagesError) {
            console.error('Error deleting messages:', deleteMessagesError)
            return NextResponse.json({ error: 'Failed to delete conversation messages' }, { status: 500 })
          }
        }

        // Delete all message reactions
        const { error: deleteReactionsError } = await (supabase as any)
          .from('message_reactions')
          .delete()
          .eq('conversation_id', conversationId)

        if (deleteReactionsError) {
          console.error('Error deleting message reactions:', deleteReactionsError)
          return NextResponse.json({ error: 'Failed to delete conversation reactions' }, { status: 500 })
        }

        // Delete all message reads
        const { error: deleteReadsError } = await (supabase as any)
          .from('message_reads')
          .delete()
          .eq('conversation_id', conversationId)

        if (deleteReadsError) {
          console.error('Error deleting message reads:', deleteReadsError)
          return NextResponse.json({ error: 'Failed to delete conversation reads' }, { status: 500 })
        }

        // Delete all participants
        const { error: deleteParticipantsError } = await (supabase as any)
          .from('conversation_participants')
          .delete()
          .eq('conversation_id', conversationId)

        if (deleteParticipantsError) {
          console.error('Error deleting participants:', deleteParticipantsError)
          return NextResponse.json({ error: 'Failed to delete conversation participants' }, { status: 500 })
        }

        // Delete the conversation itself
        const { error: deleteConversationError } = await (supabase as any)
          .from('conversations')
          .delete()
          .eq('id', conversationId)

        if (deleteConversationError) {
          console.error('Error deleting conversation:', deleteConversationError)
          return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 })
        }

        // Log audit event for admin deletion
        await (supabase as any).from('audit_logs').insert({
          actor_id: session.user.id,
          action: 'admin_delete_conversation',
          target_table: 'conversations',
          target_id: conversationId,
          payload: { message_count: messages?.length || 0, full_deletion: true }
        })

        return NextResponse.json({ message: 'Conversation permanently deleted successfully' })
      } else {
        // Regular user: only remove themselves from the conversation

        // Verify user is a participant in this conversation
        const { data: participant, error: participantError } = await supabase
          .from('conversation_participants')
          .select('id')
          .eq('conversation_id', conversationId)
          .eq('user_id', session.user.id)
          .single()

        if (participantError || !participant) {
          return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 })
        }

        // Get message count for audit
        const { count: messageCount, error: countError } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conversationId)

        // Remove the participant from the conversation
        const { error: deleteParticipantError } = await (supabase as any)
          .from('conversation_participants')
          .delete()
          .eq('conversation_id', conversationId)
          .eq('user_id', session.user.id)

        if (deleteParticipantError) {
          console.error('Error removing participant from conversation:', deleteParticipantError)
          return NextResponse.json({ error: 'Failed to leave conversation' }, { status: 500 })
        }

        // Log audit event for user leaving
        await (supabase as any).from('audit_logs').insert({
          actor_id: session.user.id,
          action: 'leave_conversation',
          target_table: 'conversations',
          target_id: conversationId,
          payload: { message_count: messageCount || 0 }
        })

        return NextResponse.json({ message: 'Left conversation successfully' })
      }
    } catch (error) {
      console.error('Error in conversation DELETE:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
