// @/app/api/admin/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      console.warn('User not found in database, returning empty notifications:', session.user.email)
      // Return empty notifications array instead of error for authenticated users
      return NextResponse.json({ notifications: [] })
    }

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    return NextResponse.json({ notifications: notifications || [] })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      console.warn('User not found in database:', session.user.email)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Notification marked as read' })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const clear = url.searchParams.get('clear')

    if (userError || !user) {
      console.warn('User not found in database:', session.user.email)
      // For clear all operation, if user doesn't exist, consider it successful (no notifications to clear)
      if (clear === 'true') {
        console.log('User not found, but clear all requested - returning success (no notifications to clear)')
        return NextResponse.json({ message: 'All notifications cleared successfully' })
      }
      // For individual delete, return error
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (clear === 'true') {
      // Clear all notifications
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json({ error: 'Failed to clear notifications' }, { status: 500 })
      }

      // Log the deletion for debugging
      console.log(`Cleared all notifications for user_id: ${user.id}`)

      return NextResponse.json({ message: 'All notifications cleared successfully' })
    } else if (id) {
      // Delete specific notification
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('id', id)

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
      }

      // Log the deletion for debugging
      console.log(`Deleted notification ${id} for user_id: ${user.id}`)

      return NextResponse.json({ message: 'Notification deleted successfully' })
    } else {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 })
    }
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
