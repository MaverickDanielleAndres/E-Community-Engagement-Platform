import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createClient } from '@supabase/supabase-js'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'No authenticated user found.' }, { status: 401 })
  }

  const userId = session.user.id
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Start transaction or sequential deletes to ensure data integrity
    // 1. Delete verification request if exists
    const { error: deleteReqError } = await supabase
      .from('verification_requests')
      .delete()
      .eq('user_id', userId)

    if (deleteReqError && deleteReqError.code !== 'PGRST116') { // PGRST116 is "no rows deleted"
      console.error('Error deleting verification request:', deleteReqError)
      return NextResponse.json({ success: false, message: 'Failed to delete verification request.' }, { status: 500 })
    }

    // 2. Delete uploaded files from storage (if any)
    const { data: files } = await supabase
      .storage
      .from('user_ids')
      .list(userId, { limit: 100 })

    if (files && files.length > 0) {
      const fileNames = files.map((file: any) => file.name)
      const { error: storageError } = await supabase
        .storage
        .from('user_ids')
        .remove([`${userId}/${fileNames.join(',')}`])

      if (storageError) {
        console.error('Error deleting storage files:', storageError)
        // Don't fail the whole operation for storage issues, but log
      }
    }

    // 3. Delete user account
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteUserError) {
      console.error('Error deleting user:', deleteUserError)
      return NextResponse.json({ success: false, message: 'Failed to delete account.' }, { status: 500 })
    }

    // Note: Sign out handled on frontend after successful deletion
    // Revoke session by deleting from auth.users if needed, but since user is deleted, session will be invalid

    return NextResponse.json({ success: true, message: 'Account and verification deleted successfully. Please sign up again.' })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json({ success: false, message: 'An unexpected error occurred.' }, { status: 500 })
  }
}
