export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const clear = url.searchParams.get('clear')

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

      return NextResponse.json({ message: 'Notification deleted successfully' })
    } else {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 })
    }
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
