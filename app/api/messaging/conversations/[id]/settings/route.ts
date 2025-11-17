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

      // Get conversation details
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id, title, color, admin_message_color, member_message_color, self_message_color')
        .eq('id', conversationId)
        .single()

      if (convError) {
        console.error('Error fetching conversation:', convError)
        return NextResponse.json({ error: 'Failed to fetch conversation settings' }, { status: 500 })
      }

      return NextResponse.json({
        title: (conversation as any).title,
        color: (conversation as any).color,
        adminMessageColor: (conversation as any).admin_message_color || '#f59e0b',
        memberMessageColor: (conversation as any).member_message_color || '#10b981',
        selfMessageColor: (conversation as any).self_message_color || '#3b82f6'
      })
    } catch (error) {
      console.error('Error in conversation settings GET:', error)
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
      const { title, color, adminMessageColor, memberMessageColor, selfMessageColor } = body

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
        // Check if it's a member-to-member conversation or default group chat
        // Get participant count by counting participants in conversation_participants table
        const { count: participantCount, error: countError } = await supabase
          .from('conversation_participants')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversationId)

        if (countError) {
          console.error('Error counting participants:', countError)
          return NextResponse.json({ error: 'Failed to fetch conversation details' }, { status: 500 })
        }

        const { data: conv, error: convError } = await supabase
          .from('conversations')
          .select('title, is_default')
          .eq('id', conversationId)
          .single()

        if (convError) {
          console.error('Error fetching conversation for validation:', convError)
          return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 })
        }

        const isGroup = (participantCount || 0) > 2
        const isAdminConv = (conv as any).title === 'Admin'
        const isDefaultGroupChat = (conv as any).is_default && isGroup

        if (isAdminConv) {
          return NextResponse.json({ error: 'Not allowed to update settings' }, { status: 403 })
        }

        // Allow title updates for default group chat, but restrict other settings
        if (isDefaultGroupChat) {
          // For default group chat, only allow title updates
          const allowedFields = ['title']
          const requestedFields = Object.keys({ title, color, adminMessageColor, memberMessageColor, selfMessageColor }).filter(key => body[key] !== undefined)
          const hasInvalidField = requestedFields.some(field => !allowedFields.includes(field))

          if (hasInvalidField) {
            return NextResponse.json({ error: 'Members can only update the title of the group chat' }, { status: 403 })
          }
        } else if (isGroup) {
          return NextResponse.json({ error: 'Not allowed to update settings' }, { status: 403 })
        }

        // Allow only title and message colors for member-to-member
        const allowedFields = ['title', 'adminMessageColor', 'memberMessageColor', 'selfMessageColor']
        const requestedFields = Object.keys({ title, color, adminMessageColor, memberMessageColor, selfMessageColor }).filter(key => body[key] !== undefined)
        const hasInvalidField = requestedFields.some(field => !allowedFields.includes(field))

        if (hasInvalidField) {
          return NextResponse.json({ error: 'Not allowed to update these fields' }, { status: 403 })
        }
      }

      // Update conversation settings
      const updateData: Record<string, any> = {}
      if (title !== undefined) updateData.title = title
      if (color !== undefined) updateData.color = color
      if (adminMessageColor !== undefined) updateData.admin_message_color = adminMessageColor
      if (memberMessageColor !== undefined) updateData.member_message_color = memberMessageColor
      if (selfMessageColor !== undefined) updateData.self_message_color = selfMessageColor

      const { error: updateError } = await (supabase as any)
        .from('conversations')
        .update(updateData)
        .eq('id', conversationId)

      if (updateError) {
        console.error('Error updating conversation settings:', updateError)
        return NextResponse.json({ error: 'Failed to update conversation settings' }, { status: 500 })
      }

      // Broadcast refresh only when conversation name (title) is changed
      if (title !== undefined) {
        await supabase.channel('refresh').send({
          type: 'broadcast',
          event: 'refresh',
          payload: { conversationId }
        })
      }

      return NextResponse.json({ message: 'Conversation settings updated successfully' })
    } catch (error) {
      console.error('Error in conversation settings PUT:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
