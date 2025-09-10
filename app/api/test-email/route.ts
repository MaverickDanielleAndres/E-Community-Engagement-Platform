// @/app/api/test-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    console.log('=== RESEND TEST ===')
    console.log('Testing email to:', email)
    console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'SET' : 'MISSING')

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ 
        error: 'RESEND_API_KEY not configured',
        success: false 
      }, { status: 500 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    // Test the simplest possible email
    const result = await resend.emails.send({
      from: 'E-Community <noreply@resend.dev>',
      to: [email],
      subject: 'Test Email from E-Community',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1e293b;">Test Email Success!</h1>
          <p>This is a test email from your E-Community platform.</p>
          <p>If you received this, your email configuration is working correctly.</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <strong>Test Code: 123456</strong>
          </div>
          <p>Sent at: ${new Date().toISOString()}</p>
        </div>
      `,
      text: `Test Email Success! This is a test email from your E-Community platform. If you received this, your email configuration is working correctly. Test Code: 123456. Sent at: ${new Date().toISOString()}`
    })

    console.log('Resend result:', result)

    if (result.error) {
      console.error('Resend error:', result.error)
      return NextResponse.json({ 
        error: 'Failed to send email', 
        details: result.error,
        success: false 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
      emailId: result.data?.id,
      to: email
    })

  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json({ 
      error: 'Failed to send test email', 
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }, { status: 500 })
  }
}