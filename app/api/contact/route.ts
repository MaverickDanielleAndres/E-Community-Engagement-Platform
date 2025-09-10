import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters')
})

// Rate limiting storage (in production, use Redis or database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(ip)
  
  if (!limit || now > limit.resetTime) {
    // Reset limit every 5 minutes
    rateLimitMap.set(ip, { count: 1, resetTime: now + 5 * 60 * 1000 })
    return false
  }
  
  if (limit.count >= 5) {
    return true
  }
  
  limit.count++
  return false
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    
    // Check rate limit
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { message: 'Too many requests. Please try again in 5 minutes.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const validatedData = contactSchema.parse(body)

    // Send email to admin
    await resend.emails.send({
      from: 'E-Community Contact <noreply@e-community.com>',
      to: [process.env.NEXT_PUBLIC_CONTACT_EMAIL!],
      subject: `[E-Community] ${validatedData.subject}`,
      reply_to: validatedData.email,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #10b981, #0ea5e9); padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
            <div style="background: white; width: 48px; height: 48px; border-radius: 12px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 24px; font-weight: bold; color: #10b981;">E</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
          </div>
          
          <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
            <div style="margin-bottom: 24px; padding: 16px; background: #f9fafb; border-radius: 8px;">
              <h3 style="margin: 0 0 12px 0; color: #374151;">Contact Information</h3>
              <p style="margin: 4px 0; color: #6b7280;"><strong>Name:</strong> ${validatedData.name}</p>
              <p style="margin: 4px 0; color: #6b7280;"><strong>Email:</strong> ${validatedData.email}</p>
              <p style="margin: 4px 0; color: #6b7280;"><strong>Subject:</strong> ${validatedData.subject}</p>
            </div>
            
            <div>
              <h3 style="margin: 0 0 12px 0; color: #374151;">Message</h3>
              <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981;">
                <p style="margin: 0; color: #374151; line-height: 1.6; white-space: pre-wrap;">${validatedData.message}</p>
              </div>
            </div>
            
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
              <a href="mailto:${validatedData.email}" 
                 style="display: inline-block; background: linear-gradient(135deg, #10b981, #0ea5e9); color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 14px;">
                Reply to ${validatedData.name}
              </a>
            </div>
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 16px;">
              Sent via E-Community Contact Form • ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `
    })

    // Send confirmation email to user
    await resend.emails.send({
      from: 'E-Community <noreply@e-community.com>',
      to: [validatedData.email],
      subject: 'Thank you for contacting E-Community',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #10b981, #0ea5e9); padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
            <div style="background: white; width: 48px; height: 48px; border-radius: 12px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 24px; font-weight: bold; color: #10b981;">E</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px;">Thank You!</h1>
          </div>
          
          <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; margin-top: 0;">We've received your message</h2>
            <p style="color: #6b7280; line-height: 1.6;">
              Hi ${validatedData.name},
            </p>
            <p style="color: #6b7280; line-height: 1.6;">
              Thank you for reaching out to E-Community! We've received your message about "${validatedData.subject}" and our team will review it promptly.
            </p>
            
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <p style="color: #166534; margin: 0; font-weight: 600;">⏰ Expected Response Time</p>
              <p style="color: #166534; margin: 8px 0 0 0; font-size: 14px;">
                We typically respond within 2 hours during business hours (Mon-Fri, 9 AM - 6 PM PHT) and within 24 hours on weekends.
              </p>
            </div>
            
            <p style="color: #6b7280; line-height: 1.6;">
              If you have any urgent concerns, please don't hesitate to reply to this email directly.
            </p>
            
            <p style="color: #6b7280; line-height: 1.6;">
              Best regards,<br>
              The E-Community Team
            </p>
            
            <div style="text-align: center; margin-top: 32px;">
              <a href="${process.env.NEXTAUTH_URL}" 
                 style="display: inline-block; background: linear-gradient(135deg, #10b981, #0ea5e9); color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 14px;">
                Visit E-Community
              </a>
            </div>
          </div>
        </div>
      `
    })

    return NextResponse.json({
      message: 'Message sent successfully! We\'ll get back to you within 2 hours.'
    }, { status: 200 })

  } catch (error) {
    console.error('Contact form error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          message: 'Invalid input data',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Failed to send message. Please try again later.' },
      { status: 500 }
    )
  }
}