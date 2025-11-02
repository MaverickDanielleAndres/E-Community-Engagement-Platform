import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSupabaseServerClient } from '@/lib/supabase'
import { messagingMiddleware } from '@/lib/messaging-middleware'

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

      // Get all messages in the conversation before deletion
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId)

      // Soft delete all messages in the conversation
      if (messages && messages.length > 0) {
        const { error: deleteMessagesError } = await (supabase as any)
          .from('messages')
          .update({ deleted_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)

        if (deleteMessagesError) {
          console.error('Error deleting messages:', deleteMessagesError)
          return NextResponse.json({ error: 'Failed to delete conversation messages' }, { status: 500 })
        }
      }

      // Soft delete the conversation (note: conversations table doesn't have deleted_at column, so we skip this)
      // const { error: deleteConversationError } = await (supabase as any)
      //   .from('conversations')
      //   .update({ deleted_at: new Date().toISOString() })
      //   .eq('id', conversationId)

      // Instead, just remove the participant from the conversation
      const { error: deleteParticipantError } = await (supabase as any)
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', session.user.id)

      if (deleteParticipantError) {
        console.error('Error removing participant from conversation:', deleteParticipantError)
        return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 })
      }

      // Log audit event
      await (supabase as any).from('audit_logs').insert({
        actor_id: session.user.id,
        action: 'delete_conversation',
        target_table: 'conversations',
        target_id: conversationId,
        payload: { message_count: messages?.length || 0 }
      })

      return NextResponse.json({ message: 'Conversation deleted successfully' })
    } catch (error) {
      console.error('Error in conversation DELETE:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
