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

    if (!session?.user) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', session.user?.email!)
      .single()

    if (userError || !user || user.role !== 'Admin') {
      return NextResponse.json({
        success: false,
        message: 'Access denied'
      }, { status: 403 })
    }

    const url = new URL(request.url)
    const history = url.searchParams.get('history') === 'true'

    // Fetch verification requests with email directly from id_verifications table and approved_at
    let query = supabase
      .from('id_verifications')
      .select(`
        id,
        user_id,
        full_name,
        address,
        submitted_at,
        approved_at,
        status,
        email
      `)
      .order('submitted_at', { ascending: false })

    if (history) {
      // Fetch approved and rejected requests for history
      query = query.in('status', ['approved', 'rejected'])
    } else {
      // Fetch only pending requests
      query = query.eq('status', 'pending')
    }

    const { data: requests, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch requests'
      }, { status: 500 })
    }

    // Transform the data to match frontend expectations
    const transformedRequests = (requests || []).map(request => {
      return {
        ...request,
        created_at: request.submitted_at,
        approved_at: request.approved_at || null,
        email: request.email || ''
      }
    })

    return NextResponse.json({
      success: true,
      requests: transformedRequests
    })

  } catch (error) {
    console.error('Verification requests error:', error)
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role, community_members(community_id)')
      .eq('email', session.user.email)
      .single()

    if (userError || !user || user.role !== 'Admin') {
      return NextResponse.json({
        success: false,
        message: 'Access denied'
      }, { status: 403 })
    }

    const { action, id } = await request.json()

    if (!action || !id) {
      return NextResponse.json({
        success: false,
        message: 'Missing action or ID'
      }, { status: 400 })
    }

    if (!['approve', 'reject', 'delete', 'delete_history', 'clear_history'].includes(action)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid action'
      }, { status: 400 })
    }

    let updateResult

    if (action === 'delete') {
      // Delete the verification request
      const { error: deleteError } = await supabase
        .from('id_verifications')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('Delete error:', deleteError)
        return NextResponse.json({
          success: false,
          message: 'Failed to delete request'
        }, { status: 500 })
      }

      // Log audit trail
      await supabase
        .from('audit_log')
        .insert({
          community_id: user.community_members?.[0]?.community_id || null,
          user_id: user.id,
          action_type: 'delete_verification_request',
          entity_type: 'verification_request',
          entity_id: id,
          details: { deleted_request_id: id }
        })

      return NextResponse.json({
        success: true,
        message: 'Request deleted successfully'
      })
    } else if (action === 'delete_history') {
      // Delete a history entry (approved/rejected)
      const { error: deleteError } = await supabase
        .from('id_verifications')
        .delete()
        .eq('id', id)
        .in('status', ['approved', 'rejected'])

      if (deleteError) {
        console.error('Delete history error:', deleteError)
        return NextResponse.json({
          success: false,
          message: 'Failed to delete history entry'
        }, { status: 500 })
      }

      // Log audit trail
      await supabase
        .from('audit_log')
        .insert({
          community_id: user.community_members?.[0]?.community_id || null,
          user_id: user.id,
          action_type: 'delete_verification_history',
          entity_type: 'verification_request',
          entity_id: id,
          details: { deleted_history_id: id }
        })

      return NextResponse.json({
        success: true,
        message: 'History entry deleted successfully'
      })
    } else if (action === 'clear_history') {
      // Clear all history entries (approved/rejected)
      const { error: clearError } = await supabase
        .from('id_verifications')
        .delete()
        .in('status', ['approved', 'rejected'])

      if (clearError) {
        console.error('Clear history error:', clearError)
        return NextResponse.json({
          success: false,
          message: 'Failed to clear history'
        }, { status: 500 })
      }

      // Log audit trail
      await supabase
        .from('audit_log')
        .insert({
          community_id: user.community_members?.[0]?.community_id || null,
          user_id: user.id,
          action_type: 'clear_verification_history',
          entity_type: 'verification_request',
          entity_id: null,
          details: { action: 'cleared_all_history' }
        })

      return NextResponse.json({
        success: true,
        message: 'History cleared successfully'
      })
    } else {
      // Update status for approve/reject
      let newStatus: string
      let updateData: any = { status: '' }
      if (action === 'approve') {
        newStatus = 'approved'
        updateData = { status: newStatus, approved_at: new Date().toISOString() }
      } else if (action === 'reject') {
        newStatus = 'rejected'
        updateData = { status: newStatus }
      } else {
        return NextResponse.json({
          success: false,
          message: 'Invalid action'
        }, { status: 400 })
      }

      updateResult = await supabase
        .from('id_verifications')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateResult.error) {
        console.error('Update error:', updateResult.error)
        return NextResponse.json({
          success: false,
          message: `Failed to ${action} request`
        }, { status: 500 })
      }

      // Log audit trail for approve/reject
      await supabase
        .from('audit_log')
        .insert({
          community_id: user.community_members?.[0]?.community_id || null,
          user_id: user.id,
          action_type: action === 'approve' ? 'approve_verification_request' : 'reject_verification_request',
          entity_type: 'verification_request',
          entity_id: id,
          details: {
            action: action,
            user_id: updateResult.data.user_id,
            email: updateResult.data.email
          }
        })

      // If approved, update user status and add to community
      if (action === 'approve') {
        const { data: verification } = updateResult

        // Ensure admin has a community (create if needed)
        let communityId = null

        // Check if admin already has a community
        const { data: adminCommunity, error: communityError } = await supabase
          .from('community_members')
          .select('community_id')
          .eq('user_id', user.id)
          .eq('role', 'Admin')
          .single()

        if (communityError && communityError.code === 'PGRST116') { // No rows returned
          console.log('Admin has no community, creating one...')

          // Generate unique community code
          let communityCode = ''
          let counter = 1

          while (true) {
            const testCode = `ADMIN${String(counter).padStart(3, '0')}`
            const { data: existing } = await supabase
              .from('communities')
              .select('id')
              .eq('code', testCode)
              .single()

            if (!existing) {
              communityCode = testCode
              break
            }
            counter++
          }

          // Create new community
          const { data: newCommunity, error: communityCreateError } = await supabase
            .from('communities')
            .insert({
              name: `${session.user?.name || 'Admin'}'s Community`,
              code: communityCode
            })
            .select('id')
            .single()

          if (communityCreateError) {
            console.error('Failed to create community:', communityCreateError)
            return NextResponse.json({
              success: false,
              message: 'Failed to create admin community'
            }, { status: 500 })
          }

          communityId = newCommunity.id

          // Add admin as member
          const { error: adminMemberError } = await supabase
            .from('community_members')
            .insert({
              community_id: communityId,
              user_id: user.id,
              role: 'Admin'
            })

          if (adminMemberError) {
            console.error('Failed to add admin to community:', adminMemberError)
            return NextResponse.json({
              success: false,
              message: 'Failed to add admin to community'
            }, { status: 500 })
          }

          console.log('Created admin community:', communityId)
        } else if (communityError) {
          console.error('Admin community lookup error:', communityError)
          return NextResponse.json({
            success: false,
            message: 'Failed to find admin community'
          }, { status: 500 })
        } else {
          communityId = adminCommunity.community_id
        }

        // Add user to community as Resident
        const { error: memberError } = await supabase
          .from('community_members')
          .insert({
            community_id: communityId,
            user_id: verification.user_id,
            role: 'Resident'
          })

        if (memberError) {
          console.error('Community member insertion error:', memberError)
          return NextResponse.json({
            success: false,
            message: 'Failed to add user to community'
          }, { status: 500 })
        }

        // Update user status in users table
        const { data: userUpdateData, error: userUpdateError } = await supabase
          .from('users')
          .update({ status: 'approved' })
          .eq('id', verification.user_id)
          .select()

        if (userUpdateError || !userUpdateData || userUpdateData.length !== 1) {
          console.error('User status update error:', userUpdateError)
          return NextResponse.json({
            success: false,
            message: 'Failed to update user status'
          }, { status: 500 })
        }

        // Log audit trail for member creation
        await supabase
          .from('audit_log')
          .insert({
            community_id: communityId,
            user_id: user.id,
            action_type: 'create_member',
            entity_type: 'user',
            entity_id: verification.user_id,
            details: {
              action: 'approved_verification',
              user_email: verification.email,
              role_assigned: 'Resident'
            }
          })

        // Create notification for the approved user
        const notifications = [{
          user_id: verification.user_id,
          type: 'verification_approved',
          title: 'Your ID verification has been approved',
          body: 'Congratulations! Your ID verification has been approved and you have been added to the community.',
          link_url: '/main/user',
          is_read: false,
          created_at: new Date().toISOString()
        }]

        await supabase.from('notifications').insert(notifications)
      }

      // If rejected, update user status to rejected
      if (action === 'reject') {
        const { data: verification } = updateResult

        const { data: userUpdateData, error: userUpdateError } = await supabase
          .from('users')
          .update({ status: 'rejected' })
          .eq('id', verification.user_id)
          .select()

        if (userUpdateError || !userUpdateData || userUpdateData.length !== 1) {
          console.error('User status update error:', userUpdateError)
          return NextResponse.json({
            success: false,
            message: 'Failed to update user status'
          }, { status: 500 })
        }

        // Create notification for the rejected user
        const notifications = [{
          user_id: verification.user_id,
          type: 'verification_rejected',
          title: 'Your ID verification has been rejected',
          body: 'Unfortunately, your ID verification request has been rejected. Please contact support for more information.',
          link_url: '/main/user',
          is_read: false,
          created_at: new Date().toISOString()
        }]

        await supabase.from('notifications').insert(notifications)
      }

      return NextResponse.json({
        success: true,
        message: `Request ${action}d successfully. User role updated.`
      })
    }

  } catch (error) {
    console.error('Verification action error:', error)
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred'
    }, { status: 500 })
  }
}
