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
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Delete all messages in the conversation
      const { error: deleteError } = await (supabase as any)
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId)

      if (deleteError) {
        console.error('Error clearing messages:', deleteError)
        return NextResponse.json({ error: 'Failed to clear messages' }, { status: 500 })
      }

      // Log audit event for clearing messages
      await (supabase as any).from('audit_logs').insert({
        actor_id: session.user.id,
        action: 'clear_conversation_messages',
        target_table: 'conversations',
        target_id: conversationId,
        payload: { cleared_all_messages: true }
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error in clear messages API:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
