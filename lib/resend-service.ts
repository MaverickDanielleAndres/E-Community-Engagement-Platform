// @/lib/resend-service.ts
import { Resend } from 'resend'
import { getSupabaseServerClient } from './supabase'

// Initialize Resend properly for 2025
const resend = new Resend(process.env.RESEND_API_KEY!)

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

interface VerificationEmailOptions {
  email: string
  code: string
  name?: string
}

export class ModernResendService {
  private static readonly SENDER_EMAIL = process.env.RESEND_SENDER_EMAIL || 'E-Community <noreply@resend.dev>'
  private static readonly CODE_EXPIRY_MINUTES = 15

  /**
   * Send verification email with proper error handling
   */
  static async sendVerificationEmail({ email, code, name }: VerificationEmailOptions) {
    try {
      console.log(`📧 Sending verification email to: ${email}`)
      console.log(`🔢 Verification code: ${code}`)

      const emailOptions: EmailOptions = {
        to: email,
        subject: `Your E-Community verification code: ${code}`,
        html: this.getVerificationEmailTemplate(code, name || 'User'),
        text: this.getVerificationEmailText(code)
      }

      const result = await resend.emails.send({
        from: this.SENDER_EMAIL,
        to: [emailOptions.to],
        subject: emailOptions.subject,
        html: emailOptions.html,
        text: emailOptions.text,
        tags: [
          { name: 'type', value: 'verification' },
          { name: 'environment', value: process.env.NODE_ENV || 'development' }
        ]
      })

      if (result.error) {
        console.error('❌ Resend API Error:', result.error)
        throw new Error(`Email sending failed: ${result.error.message}`)
      }

      console.log('✅ Email sent successfully:', result.data?.id)
      return {
        success: true,
        emailId: result.data?.id,
        message: 'Verification email sent successfully'
      }

    } catch (error) {
      console.error('💥 Email service error:', error)
      
      // Log the code for development fallback
      if (process.env.NODE_ENV === 'development') {
        console.log('\n🚨 DEVELOPMENT FALLBACK - EMAIL FAILED 🚨')
        console.log('='.repeat(50))
        console.log(`📧 Email: ${email}`)
        console.log(`🔢 Code: ${code}`)
        console.log(`⏰ Expires: ${this.CODE_EXPIRY_MINUTES} minutes`)
        console.log('='.repeat(50))
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error',
        fallbackCode: process.env.NODE_ENV === 'development' ? code : undefined
      }
    }
  }

  /**
   * Send test email
   */
  static async sendTestEmail(email: string) {
    try {
      const result = await resend.emails.send({
        from: this.SENDER_EMAIL,
        to: [email],
        subject: 'E-Community Test Email',
        html: this.getTestEmailTemplate(),
        text: 'This is a test email from E-Community. If you received this, your email configuration is working!',
        tags: [
          { name: 'type', value: 'test' },
          { name: 'environment', value: process.env.NODE_ENV || 'development' }
        ]
      })

      return {
        success: !result.error,
        emailId: result.data?.id,
        error: result.error?.message
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get modern verification email template
   */
  private static getVerificationEmailTemplate(code: string, name: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your E-Community Account</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a202c;
            background-color: #f7fafc;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
          }
          
          .logo {
            width: 60px;
            height: 60px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            backdrop-filter: blur(10px);
          }
          
          .header h1 {
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 8px;
          }
          
          .header p {
            font-size: 16px;
            opacity: 0.9;
          }
          
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          
          .greeting {
            font-size: 18px;
            color: #2d3748;
            margin-bottom: 30px;
          }
          
          .code-container {
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border: 2px dashed #cbd5e0;
            border-radius: 16px;
            padding: 30px 20px;
            margin: 30px 0;
            position: relative;
          }
          
          .code {
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
            font-size: 36px;
            font-weight: 700;
            color: #2b6cb0;
            letter-spacing: 8px;
            margin: 10px 0;
            user-select: all;
          }
          
          .code-label {
            font-size: 14px;
            color: #718096;
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 1px;
          }
          
          .expiry {
            background: #fef5e7;
            border: 1px solid #f6e05e;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #744210;
            font-size: 14px;
          }
          
          .instructions {
            color: #4a5568;
            font-size: 16px;
            line-height: 1.6;
            margin: 20px 0;
          }
          
          .security-notice {
            background: #fed7d7;
            border: 1px solid #fc8181;
            border-radius: 8px;
            padding: 15px;
            margin: 30px 0;
            color: #742a2a;
            font-size: 14px;
            text-align: left;
          }
          
          .footer {
            background: #f7fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          
          .footer-content {
            color: #718096;
            font-size: 14px;
            line-height: 1.5;
          }
          
          .footer-logo {
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 8px;
          }
          
          @media (max-width: 600px) {
            .content {
              padding: 30px 20px;
            }
            
            .code {
              font-size: 28px;
              letter-spacing: 4px;
            }
            
            .header {
              padding: 30px 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">E</div>
            <h1>Email Verification</h1>
            <p>Secure your E-Community account</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              Hello ${name}! 👋
            </div>
            
            <p class="instructions">
              Welcome to E-Community! Please use the verification code below to complete your account setup.
            </p>
            
            <div class="code-container">
              <div class="code-label">Your Verification Code</div>
              <div class="code">${code}</div>
            </div>
            
            <div class="expiry">
              ⏰ This code will expire in ${this.CODE_EXPIRY_MINUTES} minutes
            </div>
            
            <p class="instructions">
              Copy and paste this code into the verification form to activate your account.
            </p>
            
            <div class="security-notice">
              <strong>🔐 Security Notice:</strong> If you didn't request this verification, please ignore this email and do not share this code with anyone. This code is unique to your account and should remain confidential.
            </div>
          </div>
          
          <div class="footer">
            <div class="footer-content">
              <div class="footer-logo">E-Community Platform</div>
              <p>Connecting communities, empowering decisions.</p>
              <p style="margin-top: 15px; font-size: 12px; color: #a0aec0;">
                This is an automated message from E-Community. Please do not reply to this email.
              </p>
              <p style="font-size: 12px; color: #a0aec0;">
                © ${new Date().getFullYear()} E-Community. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Get plain text version of verification email
   */
  private static getVerificationEmailText(code: string): string {
    return `
Welcome to E-Community!

Your verification code is: ${code}

This code will expire in ${this.CODE_EXPIRY_MINUTES} minutes.

Please enter this code in the verification form to complete your account setup.

Security Notice: If you didn't request this verification, please ignore this email and do not share this code with anyone.

Best regards,
The E-Community Team

---
This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} E-Community. All rights reserved.
    `.trim()
  }

  /**
   * Get test email template
   */
  private static getTestEmailTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>E-Community Test Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; border-radius: 10px; text-align: center;">
          <h1>🎉 Email Test Successful!</h1>
          <p>Your E-Community email configuration is working perfectly.</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9; margin-top: 20px; border-radius: 10px;">
          <h2>Test Details:</h2>
          <ul>
            <li><strong>Service:</strong> Resend</li>
            <li><strong>Environment:</strong> ${process.env.NODE_ENV}</li>
            <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
          </ul>
        </div>
      </body>
      </html>
    `
  }
}