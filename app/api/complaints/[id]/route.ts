// app/api/complaints/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Fetch complaint with user details
    const { data: complaint, error } = await supabase
      .from('complaints')
      .select(`
        id,
        title,
        description,
        category,
        status,
        priority,
        sentiment,
        created_at,
        updated_at,
        users(name, email)
      `)
      .eq('id', id)
      .single()

    if (error || !complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    return NextResponse.json({ complaint })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // First get the complaint to find its community and check status
    const { data: complaint } = await supabase
      .from('complaints')
      .select('community_id, status')
      .eq('id', id)
      .single()

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    // Only allow deletion if status is resolved
    if (complaint.status !== 'resolved') {
      return NextResponse.json({ error: 'Only resolved complaints can be deleted' }, { status: 400 })
    }

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is admin in the complaint's community
    const { data: membership } = await supabase
      .from('community_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('community_id', complaint.community_id)
      .single()

    // Check role: prefer community role, fallback to user role
    const userRole = membership?.role || user.role
    if (userRole?.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Delete the complaint
    const { error } = await supabase
      .from('complaints')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: 'Failed to delete complaint' }, { status: 500 })
    }

    // Log audit trail
    await supabase
      .from('audit_log')
      .insert({
        community_id: complaint.community_id,
        user_id: user.id,
        action_type: 'delete_complaint',
        entity_type: 'complaint',
        entity_id: id,
        details: { deleted_at: new Date().toISOString() }
      })

    return NextResponse.json({ message: 'Complaint deleted successfully' })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    // First get the complaint to find its community and user
    const { data: complaint } = await supabase
      .from('complaints')
      .select('community_id, user_id')
      .eq('id', id)
      .single()

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
    }

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is admin in the complaint's community
    const { data: membership } = await supabase
      .from('community_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('community_id', complaint.community_id)
      .single()

    // Check role: prefer community role, fallback to user role
    const userRole = membership?.role || user.role
    if (userRole?.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Update complaint with updated_at timestamp
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    }

    const { data: updatedComplaint, error } = await supabase
      .from('complaints')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        title,
        description,
        category,
        status,
        priority,
        sentiment,
        created_at,
        updated_at,
        users(name, email)
      `)
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 })
    }

    // Log audit trail
    await supabase
      .from('audit_log')
      .insert({
        community_id: complaint.community_id,
        user_id: user.id,
        action_type: 'update_complaint',
        entity_type: 'complaint',
        entity_id: id,
        details: updateData
      })

    // Notify user about complaint status update
    await supabase.from('notifications').insert({
      user_id: complaint.user_id,
      title: 'Complaint Status Updated',
      message: `Your complaint titled "${updatedComplaint.title}" status has been updated to "${updatedComplaint.status}".`,
      is_read: false,
      created_at: new Date().toISOString()
    })

    return NextResponse.json({
      message: 'Complaint updated successfully',
      complaint: updatedComplaint
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}