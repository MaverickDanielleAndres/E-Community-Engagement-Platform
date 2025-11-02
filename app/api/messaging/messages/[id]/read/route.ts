import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import auth from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();
    const messageId = params.id;

    // First check if user is participant in the conversation
    const { data: message } = await (supabase as any)
      .from('messages')
      .select('conversation_id')
      .eq('id', messageId)
      .single();

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const { data: participant } = await (supabase as any)
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', message.conversation_id)
      .eq('user_id', session.user.id)
      .single();

    if (!participant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Mark message as read for current user
    const { error } = await (supabase as any)
      .from('message_status')
      .upsert({
        message_id: messageId,
        user_id: session.user.id,
        status: 'read',
        status_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error marking message as read:', error);
      return NextResponse.json({ error: 'Failed to mark message as read' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in read message API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
