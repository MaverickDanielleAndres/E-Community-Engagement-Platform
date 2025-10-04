import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSupabaseServerClient } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const supabase = getSupabaseServerClient()

    // Get user's community_id from user_roles view
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('community_id')
      .eq('email', session.user.email)
      .single()

    if (roleError || !(userRole as any)?.community_id) {
      return NextResponse.json({ error: 'User community not found' }, { status: 404 })
    }

    // Delete the complaint - only if it belongs to the user
    const { error } = await supabase
      .from('complaints')
      .delete()
      .eq('id', id)
      .eq('user_email', session.user.email)
      .eq('community_id', (userRole as any).community_id)

    if (error) {
      console.error('Error deleting complaint:', error)
      return NextResponse.json({ error: 'Failed to delete complaint' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Complaint deleted successfully' })
  } catch (error) {
    console.error('Error in user complaint delete:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
