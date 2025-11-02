import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const createConversationSchema = z.object({
  userId: z.string().uuid()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get user's community from community_members
    const { data: userCommunity } = await (supabase as any)
      .from('community_members')
      .select('community_id')
      .eq('user_id', session.user.id)
      .single();

    if (!userCommunity?.community_id) {
      return NextResponse.json({ error: 'User not in a community' }, { status: 400 });
    }

    let query = supabase
      .from('users')
      .select(`
        id, name, email, image, status, role,
        community_members!inner(community_id, role)
      `)
      .eq('community_members.community_id', userCommunity.community_id)
      .neq('id', session.user.id)
      .neq('community_members.role', 'Admin')
      .order('name');

    // Add search functionality
    if (search.trim()) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    query = query.limit(limit);

    const { data: users, error } = await query;

    if (error) {
      console.error('Error fetching contacts:', error);
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
    }

    // Transform the data to match expected format - users is already the correct format
    const contacts = users || [];

    // Get conversation participants to mark existing contacts (only if user has conversations)
    const { data: participants } = await (supabase as any)
      .from('conversation_participants')
      .select('conversation_id, user_id')
      .eq('user_id', session.user.id);

    const conversationIds = participants?.map((p: any) => p.conversation_id) || [];

    if (conversationIds.length > 0) {
      const { data: existingContacts } = await (supabase as any)
        .from('conversation_participants')
        .select('user_id, conversation_id')
        .in('conversation_id', conversationIds)
        .neq('user_id', session.user.id);

      const contactMap = new Map();
      existingContacts?.forEach((contact: any) => {
        contactMap.set(contact.user_id, contact.conversation_id);
      });

      users.forEach((user: any) => {
        user.has_conversation = contactMap.has(user.id);
        user.conversation_id = contactMap.get(user.id);
      });
    } else {
      users.forEach((user: any) => {
        user.has_conversation = false;
        user.conversation_id = null;
      });
    }

    return NextResponse.json({ contacts: users });
  } catch (error) {
    console.error('Error in contacts API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = createConversationSchema.parse(body);

    const supabase = getSupabaseServerClient();

    // Get user's community from community_members
    const { data: userCommunity } = await (supabase as any)
      .from('community_members')
      .select('community_id')
      .eq('user_id', session.user.id)
      .single();

    if (!userCommunity?.community_id) {
      return NextResponse.json({ error: 'User not in a community' }, { status: 400 });
    }

    // Check if target user exists and is not an admin
    const { data: targetUser } = await (supabase as any)
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    if (targetUser.role === 'admin') {
      return NextResponse.json({ error: 'Cannot message administrators' }, { status: 403 });
    }

    // Check if conversation already exists
    const { data: existingConv } = await (supabase as any)
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversations!inner(id)
      `)
      .eq('user_id', session.user.id)
      .in('conversation_id',
        (await (supabase as any)
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', userId)
        ).data?.map((c: any) => c.conversation_id) || []
      );

    if (existingConv && existingConv.length > 0) {
      return NextResponse.json({
        conversation: { id: (existingConv[0] as any).conversation_id }
      });
    }

    // Create new conversation
    const { data: conversation, error: convError } = await (supabase as any)
      .from('conversations')
      .insert({
        community_id: userCommunity.community_id,
        is_group: false,
        created_by: session.user.id
      })
      .select()
      .single();

    if (convError) {
      console.error('Error creating conversation:', convError);
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    // Add participants
    const participants = [
      { conversation_id: (conversation as any).id, user_id: session.user.id },
      { conversation_id: (conversation as any).id, user_id: userId }
    ];

    const { error: partError } = await (supabase as any)
      .from('conversation_participants')
      .insert(participants);

    if (partError) {
      console.error('Error adding participants:', partError);
      // Clean up conversation if participants failed
      await (supabase as any).from('conversations').delete().eq('id', (conversation as any).id);
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    // Log audit event
    await (supabase as any).from('audit_logs').insert({
      actor_id: session.user.id,
      action: 'create_conversation',
      target_table: 'conversations',
      target_id: (conversation as any).id,
      payload: { participant_ids: [userId] }
    });

    return NextResponse.json({ conversation: { id: (conversation as any).id } }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }

    console.error('Error in contacts POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
