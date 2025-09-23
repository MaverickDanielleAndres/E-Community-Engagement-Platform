// @/lib/email-verification.ts
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

export class EmailVerificationService {
  static async sendVerificationEmail(email: string, verificationCode?: string) {
    try {
      console.log('=== SENDING VERIFICATION EMAIL ===')
      console.log('Email:', email)
      console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'SET' : 'MISSING')

      if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY not configured')
        return {
          success: false,
          message: 'Email service not configured'
        }
      }

      // Use provided code or generate new one
      const code = verificationCode || Math.random().toString(36).substring(2, 8).toUpperCase()
      
      console.log('Generated verification code:', code)

      // Create verification record in database (for email_verifications table)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      
      // Clean up any existing verification for this email
      await supabase
        .from('email_verifications')
        .delete()
        .eq('email', email)

      // Create new verification record
      const { data: verification, error: verificationError } = await supabase
        .from('email_verifications')
        .insert({
          email: email,
          otp: code,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single()

      if (verificationError) {
        console.error('Failed to create verification record:', verificationError)
        return {
          success: false,
          message: 'Failed to create verification record'
        }
      }

      // Send email using Resend
      const emailResult = await resend.emails.send({
        from: 'E-Community <noreply@resend.dev>',
        to: [email],
        subject: 'Verify your E-Community account',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="color: white; font-size: 32px; font-weight: bold;">E</span>
              </div>
              <h1 style="color: #1e293b; margin: 0; font-size: 28px; font-weight: 700;">Welcome to E-Community!</h1>
              <p style="color: #64748b; margin: 8px 0 0 0; font-size: 16px;">Verify your email address to complete your registration</p>
            </div>
            
            <div style="background: #f8fafc; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
              <p style="color: #475569; margin: 0 0 20px 0; font-size: 16px;">Your verification code is:</p>
              <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #1e293b; letter-spacing: 8px; margin: 0 auto; display: inline-block;">
                ${code}
              </div>
              <p style="color: #64748b; margin: 20px 0 0 0; font-size: 14px;">This code will expire in 15 minutes</p>
            </div>
            
            <div style="background: #fef3cd; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin-bottom: 30px;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>Security note:</strong> If you didn't request this verification, please ignore this email. Never share your verification code with anyone.
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; margin: 0; font-size: 14px;">
                Need help? Contact us at <a href="mailto:support@e-community.com" style="color: #3b82f6;">support@e-community.com</a>
              </p>
            </div>
          </div>
        `,
        text: `Welcome to E-Community! Your verification code is: ${code}. This code will expire in 15 minutes. If you didn't request this verification, please ignore this email.`
      })

      console.log('Resend email result:', emailResult)

      if (emailResult.error) {
        console.error('Resend error:', emailResult.error)
        // Clean up verification record if email failed
        await supabase
          .from('email_verifications')
          .delete()
          .eq('email', email)
        
        return {
          success: false,
          message: 'Failed to send verification email'
        }
      }

      console.log('Verification email sent successfully')
      return {
        success: true,
        message: 'Verification code sent to your email',
        emailId: emailResult.data?.id
      }

    } catch (error) {
      console.error('Email verification service error:', error)
      return {
        success: false,
        message: 'Failed to send verification email'
      }
    }
  }

  static verifyCode(email: string, code: string) {
    // This method is kept for backwards compatibility
    // The actual verification is now handled in the API route
    return {
      success: false,
      message: 'Please use the API endpoint for verification'
    }
  }

  static async checkRateLimit(email: string): Promise<boolean> {
    try {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
      
      const { data: recentAttempts, error } = await supabase
        .from('otp_attempts')
        .select('id')
        .eq('email', email)
        .gte('created_at', oneMinuteAgo.toISOString())

      if (error) {
        console.error('Rate limit check error:', error)
        return false
      }

      // Allow max 3 attempts per minute
      return (recentAttempts?.length || 0) < 3
    } catch (error) {
      console.error('Rate limit check error:', error)
      return false
    }
  }

  static async logAttempt(email: string) {
    try {
      await supabase
        .from('otp_attempts')
        .insert({ email })
    } catch (error) {
      console.error('Failed to log OTP attempt:', error)
    }
  }
}