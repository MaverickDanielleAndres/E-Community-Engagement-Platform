import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSupabaseServerClient } from '@/lib/supabase'
import { messagingMiddleware } from '@/lib/messaging-middleware'
import { deleteAttachment } from '@/lib/media-processing'

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

      const messageId = params.id
      const { content } = await request.json()

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return NextResponse.json({ error: 'Content is required' }, { status: 400 })
      }

      const supabase = getSupabaseServerClient()

      // First, get the message and check if it exists and not deleted
      const { data: message, error: msgError } = await supabase
        .from('messages')
        .select('id, sender_id, conversation_id, body')
        .eq('id', messageId)
        .is('deleted_at', null)
        .single()

      if (msgError || !message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 })
      }

      // Only allow sender to edit their own messages
      if ((message as any).sender_id !== session.user.id) {
        return NextResponse.json({ error: 'Can only edit your own messages' }, { status: 403 })
      }

      // Check if user is participant in the conversation
      const { data: participant, error: partError } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', (message as any).conversation_id)
        .eq('user_id', session.user.id)
        .single()

      if (partError || !participant) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      // Update the message content and metadata
      const { data: updatedMessage, error: updateError } = await (supabase as any)
        .from('messages')
        .update({
          body: content.trim(),
          metadata: { isEdited: true }
        })
        .eq('id', messageId)
        .select('id, body, created_at, metadata')
        .single()

      if (updateError) {
        console.error('Error updating message:', updateError)
        return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
      }

      // Log audit event
      await (supabase as any).from('audit_logs').insert({
        actor_id: session.user.id,
        action: 'edit_message',
        target_table: 'messages',
        target_id: messageId,
        payload: {
          conversation_id: (message as any).conversation_id,
          old_content: (message as any).body,
          new_content: content.trim()
        }
      })

      return NextResponse.json({
        message: 'Message updated successfully',
        data: updatedMessage
      })
    } catch (error) {
      console.error('Error in message PUT:', error)
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

    const messageId = params.id
    const supabase = getSupabaseServerClient()

    // First, get the message and check if it exists and not deleted
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .select('id, sender_id, conversation_id')
      .eq('id', messageId)
      .is('deleted_at', null)
      .single()

    if (msgError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Only allow sender to delete their own messages
    if ((message as any).sender_id !== session.user.id) {
      return NextResponse.json({ error: 'Can only delete your own messages' }, { status: 403 })
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

    // Get attachments before deleting message
    const { data: attachments, error: attachError } = await supabase
      .from('message_attachments')
      .select('id')
      .eq('message_id', messageId)

    // Soft delete the message
    const { error: deleteError } = await (supabase as any)
      .from('messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', messageId)

    if (deleteError) {
      console.error('Error deleting message:', deleteError)
      return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
    }

    // Delete associated attachments
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        await deleteAttachment((attachment as any).id)
      }
    }

    // Log audit event
    await (supabase as any).from('audit_logs').insert({
      actor_id: session.user.id,
      action: 'delete_message',
      target_table: 'messages',
      target_id: messageId,
      payload: { conversation_id: (message as any).conversation_id }
    })

    return NextResponse.json({ message: 'Message deleted successfully' })
  } catch (error) {
    console.error('Error in message DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
  })
}
