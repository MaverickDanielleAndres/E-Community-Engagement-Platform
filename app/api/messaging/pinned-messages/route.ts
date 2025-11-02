import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // Verify user is participant in conversation
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', session.user.id)
      .single();

    if (!participant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get pinned messages
    const { data: pinnedMessages, error } = await supabase
      .from('pinned_messages')
      .select(`
        id,
        message_id,
        pinned_by,
        pinned_at,
        messages (
          id,
          body,
          type,
          created_at,
          users!messages(sender_id) (name)
        )
      `)
      .eq('conversation_id', conversationId)
      .order('pinned_at', { ascending: false });

    if (error) {
      console.error('Error fetching pinned messages:', error);
      return NextResponse.json({ error: 'Failed to fetch pinned messages' }, { status: 500 });
    }

    return NextResponse.json({ pinnedMessages });
  } catch (error) {
    console.error('Error in pinned messages API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, messageId } = await request.json();

    if (!conversationId || !messageId) {
      return NextResponse.json({ error: 'Conversation ID and Message ID required' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // Verify user is participant in conversation
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', session.user.id)
      .single();

    if (!participant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify message exists in conversation
    const { data: message } = await supabase
      .from('messages')
      .select('id')
      .eq('id', messageId)
      .eq('conversation_id', conversationId)
      .single();

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Pin the message
    const { data: pinnedMessage, error } = await (supabase as any)
      .from('pinned_messages')
      .insert({
        conversation_id: conversationId,
        message_id: messageId,
        pinned_by: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error pinning message:', error);
      return NextResponse.json({ error: 'Failed to pin message' }, { status: 500 });
    }

    return NextResponse.json({ pinnedMessage });
  } catch (error) {
    console.error('Error in pin message API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pinnedMessageId = searchParams.get('id');

    if (!pinnedMessageId) {
      return NextResponse.json({ error: 'Pinned message ID required' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // Delete the pinned message (only if pinned by current user)
    const { error } = await supabase
      .from('pinned_messages')
      .delete()
      .eq('id', pinnedMessageId)
      .eq('pinned_by', session.user.id);

    if (error) {
      console.error('Error unpinning message:', error);
      return NextResponse.json({ error: 'Failed to unpin message' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in unpin message API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
