import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSupabaseServerClient } from '@/lib/supabase'
import { messagingMiddleware } from '@/lib/messaging-middleware'

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

      // Get all unread messages in the conversation for this user
      // First get messages not sent by the user
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .neq('sender_id', session.user.id) // Only messages not sent by the user

      if (messagesError) {
        console.error('Error fetching messages:', messagesError)
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
      }

      // Get already read message IDs for this user
      const { data: readMessages, error: readError } = await supabase
        .from('message_reads')
        .select('message_id')
        .eq('user_id', session.user.id)

      if (readError) {
        console.error('Error fetching read messages:', readError)
        return NextResponse.json({ error: 'Failed to fetch read messages' }, { status: 500 })
      }

      const readMessageIds = new Set((readMessages as any[])?.map((r: any) => r.message_id) || [])

      // Filter out already read messages
      const unreadMessages = (messages as any[])?.filter((msg: any) => !readMessageIds.has(msg.id)) || []

      // Mark messages as read
      if (unreadMessages && unreadMessages.length > 0) {
        const readRecords = unreadMessages.map((msg: any) => ({
          message_id: msg.id,
          user_id: session.user.id,
          read_at: new Date().toISOString()
        }))

        const { error: insertError } = await (supabase as any)
          .from('message_reads')
          .insert(readRecords)

        if (insertError) {
          console.error('Error marking messages as read:', insertError)
          return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 })
        }
      }

      return NextResponse.json({ message: 'Messages marked as read' })
    } catch (error) {
      console.error('Error in conversation read POST:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
