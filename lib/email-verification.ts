// @/lib/email-verification-dev.ts
import { Resend } from 'resend'

// Initialize Resend with proper error handling
let resend: Resend
try {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }
  resend = new Resend(process.env.RESEND_API_KEY)
} catch (error) {
  console.error('Failed to initialize Resend:', error)
}

interface VerificationData {
  email: string
  code: string
  expiresAt: Date
  attempts: number
  lastSentAt: Date
}

// In-memory store for OTP codes (in production, use Redis or database)
const verificationStore = new Map<string, VerificationData>()

export class EmailVerificationService {
  private static readonly CODE_LENGTH = 6
  private static readonly CODE_EXPIRY_MINUTES = 15
  private static readonly MAX_ATTEMPTS = 3
  private static readonly RATE_LIMIT_MINUTES = 60
  private static readonly MAX_RESENDS_PER_HOUR = 3

  static generateCode(): string {
    // Generate a proper 6-digit numeric code
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  static async sendVerificationEmail(email: string): Promise<{ success: boolean; message: string; canResend?: boolean }> {
    try {
      // Validate email format first
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return {
          success: false,
          message: 'Please provide a valid email address',
          canResend: false
        }
      }

      const existingData = verificationStore.get(email)
      const now = new Date()

      // Check rate limiting
      if (existingData) {
        const timeSinceLastSent = now.getTime() - existingData.lastSentAt.getTime()
        const minutesSinceLastSent = timeSinceLastSent / (1000 * 60)

        // If less than 1 minute since last send, block
        if (minutesSinceLastSent < 1) {
          return {
            success: false,
            message: 'Please wait before requesting another code.',
            canResend: false
          }
        }

        // Count resends in the last hour
        const hoursSinceLastSent = timeSinceLastSent / (1000 * 60 * 60)
        if (hoursSinceLastSent < 1 && existingData.attempts >= this.MAX_RESENDS_PER_HOUR) {
          return {
            success: false,
            message: `Too many attempts. Please wait ${Math.ceil(60 - (timeSinceLastSent / (1000 * 60)))} minutes before requesting another code.`,
            canResend: false
          }
        }
      }

      // Generate new code
      const code = this.generateCode()
      const expiresAt = new Date(now.getTime() + this.CODE_EXPIRY_MINUTES * 60 * 1000)

      // Store verification data
      verificationStore.set(email, {
        email,
        code,
        expiresAt,
        attempts: existingData ? (existingData.attempts >= this.MAX_RESENDS_PER_HOUR ? 1 : existingData.attempts + 1) : 1,
        lastSentAt: now
      })

      console.log(`Sending verification code ${code} to ${email}`) // Debug log

      // Always try to send email with Resend regardless of environment
      if (!resend) {
        console.error('Resend not initialized - check RESEND_API_KEY')
        return {
          success: false,
          message: 'Email service not available. Please try again later.',
          canResend: true
        }
      }

      const fromEmail = process.env.CONTACT_EMAIL || 'noreply@resend.dev'
      const emailResult = await resend.emails.send({
        from: `E-Community <${fromEmail}>`,
        to: [email],
        subject: 'Verify your E-Community account - Code: ' + code,
        html: this.getEmailTemplate(code, email),
        text: `Your E-Community verification code is: ${code}\n\nThis code will expire in ${this.CODE_EXPIRY_MINUTES} minutes.\n\nIf you didn't request this verification, please ignore this email.`
      })

      console.log('Resend response:', emailResult)

      if (emailResult.error) {
        console.error('Resend error:', emailResult.error)
        // For development, fall back to console logging when email fails
        console.log(`=== EMAIL SENDING FAILED - FALLBACK TO CONSOLE ===`)
        console.log(`Verification code for ${email}: ${code}`)
        console.log(`This code will expire in ${this.CODE_EXPIRY_MINUTES} minutes`)
        console.log(`Error: ${emailResult.error.message || 'Unknown error'}`)
        console.log(`==================================================`)
        // Still return success so the signup can continue with console code
        return {
          success: true,
          message: 'Verification code generated (email failed - check console).',
          canResend: true
        }
      }

      console.log(`Email sent successfully to ${email}`)
      return {
        success: true,
        message: `Verification code sent to ${email}. Check your inbox and spam folder.`,
        canResend: true
      }
    } catch (error) {
      console.error('Failed to send verification email:', error)

      // More specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Invalid API key')) {
          console.error('Resend API key is invalid')
          return {
            success: false,
            message: 'Email service configuration error. Please contact support.',
            canResend: false
          }
        }
        if (error.message.includes('rate limit')) {
          return {
            success: false,
            message: 'Too many email requests. Please wait before trying again.',
            canResend: false
          }
        }
      }

      return {
        success: false,
        message: 'Failed to send verification email. Please try again.',
        canResend: true
      }
    }
  }

  static verifyCode(email: string, inputCode: string): { success: boolean; message: string } {
    const verificationData = verificationStore.get(email)

    if (!verificationData) {
      return {
        success: false,
        message: 'No verification code found. Please request a new one.'
      }
    }

    const now = new Date()

    // Check if code has expired
    if (now > verificationData.expiresAt) {
      verificationStore.delete(email)
      return {
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      }
    }

    // Verify code (case insensitive, trim whitespace)
    if (verificationData.code !== inputCode.trim()) {
      return {
        success: false,
        message: 'Invalid verification code. Please check and try again.'
      }
    }

    // Clean up - remove from store after successful verification
    verificationStore.delete(email)

    return {
      success: true,
      message: 'Email verified successfully!'
    }
  }

  static isEmailVerified(email: string): boolean {
    // Email is considered verified if it's not in the pending verification store
    return !verificationStore.has(email)
  }

  static cleanExpiredCodes(): void {
    const now = new Date()
    for (const [email, data] of verificationStore.entries()) {
      if (now > data.expiresAt) {
        verificationStore.delete(email)
      }
    }
  }

  static getStoredCode(email: string): string | null {
    const data = verificationStore.get(email)
    return data ? data.code : null
  }

  private static getEmailTemplate(code: string, email: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your E-Community account</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          }
          .logo {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #334155, #0f172a);
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .code {
            background: linear-gradient(135deg, #1e293b, #0f172a);
            color: white;
            padding: 20px 40px;
            border-radius: 12px;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            margin: 30px 0;
            display: inline-block;
            font-family: 'Courier New', monospace;
            box-shadow: 0 8px 25px rgba(30, 41, 59, 0.3);
          }
          .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
          }
          .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">E</div>
          <h1 style="color: #1e293b; margin-bottom: 10px;">Verify your email address</h1>
          <p style="color: #64748b; font-size: 16px;">Welcome to E-Community! Please use the verification code below to complete your account setup:</p>

          <div class="code">${code}</div>

          <p style="font-size: 16px; color: #475569;">This code will expire in <strong>${this.CODE_EXPIRY_MINUTES} minutes</strong>.</p>

          <div class="warning">
            <strong>⚠️ Security Notice:</strong> If you didn't request this verification, please ignore this email and do not share this code with anyone.
          </div>

          <div class="footer">
            <p><strong>E-Community Platform</strong></p>
            <p>Connecting communities, empowering decisions.</p>
            <p style="font-size: 12px; color: #94a3b8;">This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

// Clean up expired codes every 5 minutes
if (typeof window === 'undefined') { // Only run on server
  setInterval(() => {
    EmailVerificationService.cleanExpiredCodes()
  }, 5 * 60 * 1000)
}
