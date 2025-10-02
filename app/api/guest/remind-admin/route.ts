import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Check if user can send reminder (2-hour cooldown)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('last_reminder_at, email, name')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Check cooldown (2 hours)
    if (user.last_reminder_at) {
      const lastReminder = new Date(user.last_reminder_at)
      const now = new Date()
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

      if (lastReminder > twoHoursAgo) {
        const remainingTime = Math.ceil((lastReminder.getTime() - twoHoursAgo.getTime()) / (60 * 1000))
        return NextResponse.json(
          { success: false, message: `Please wait ${remainingTime} minutes before sending another reminder` },
          { status: 429 }
        )
      }
    }

    // Get admin email (assuming admin has role 'Admin')
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .select('email')
      .eq('role', 'Admin')
      .single()

    if (adminError || !admin) {
      return NextResponse.json(
        { success: false, message: 'Admin not found' },
        { status: 500 }
      )
    }

    // Send email to admin
    const emailResult = await resend.emails.send({
      from: 'EComAI <noreply@ecomai.com>',
      to: admin.email,
      subject: 'Verification Request Reminder',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verification Request Reminder</h2>
          <p>A user has sent a reminder about their pending verification request.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>User Name:</strong> ${user.name || 'N/A'}</p>
            <p><strong>User Email:</strong> ${user.email}</p>
            <p><strong>Request Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>Please review their verification request in the admin panel.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/main/admin/requests" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Review Requests</a>
        </div>
      `
    })

    if (emailResult.error) {
      console.error('Email sending failed:', emailResult.error)
      return NextResponse.json(
        { success: false, message: 'Failed to send reminder email' },
        { status: 500 }
      )
    }

    // Update last_reminder_at
    const { error: updateError } = await supabase
      .from('users')
      .update({ last_reminder_at: new Date().toISOString() })
      .eq('id', userId)

    if (updateError) {
      console.error('Failed to update last_reminder_at:', updateError)
      // Don't fail the request if update fails, as email was sent
    }

    return NextResponse.json({
      success: true,
      message: 'Reminder sent successfully. Admin will review your request.'
    })

  } catch (error) {
    console.error('Remind admin error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
