// lib/otp.ts

import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Generate 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Check if user can request another OTP (rate limiting)
export async function canRequestOTP(email: string): Promise<boolean> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    const { data, error } = await supabase
      .from('otp_attempts')
      .select('count')
      .eq('email', email)
      .gte('created_at', oneHourAgo.toISOString())
    
    if (error) {
      console.error('Error checking OTP attempts:', error)
      return true // Allow if there's an error
    }
    
    // Limit to 3 OTPs per hour
    return !data || data.length < 3
  } catch (error) {
    console.error('Unexpected error in canRequestOTP:', error)
    return true
  }
}

// Record OTP attempt
export async function recordOTPAttempt(email: string): Promise<void> {
  try {
    await supabase
      .from('otp_attempts')
      .insert({
        email: email,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Error recording OTP attempt:', error)
  }
}

// Send OTP via Resend
export async function sendOTP(email: string, otp: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check rate limit
    const canRequest = await canRequestOTP(email)
    if (!canRequest) {
      return { 
        success: false, 
        error: 'Too many OTP requests. Please wait before requesting another code.' 
      }
    }
    
    // Record this OTP attempt
    await recordOTPAttempt(email)
    
    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.CONTACT_EMAIL || 'E-Community <noreply@e-community.vercel.app>',
      to: [email],
      subject: 'Verify your E-Community account',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify your E-Community account</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 12px 12px 0 0; padding: 30px; text-align: center;">
                <h1 style="color: white; font-size: 28px; margin: 0;">E-Community</h1>
                <p style="color: #cbd5e1; margin-top: 10px;">Verify your email address</p>
              </div>
              
              <div style="background-color: white; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
                <h2 style="color: #0f172a; font-size: 24px; margin-bottom: 20px;">Email Verification</h2>
                
                <p style="color: #334155; line-height: 1.6; margin-bottom: 20px;">
                  Thank you for signing up with E-Community! Please use the verification code below to complete your registration:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <div style="display: inline-block; padding: 15px 30px; background-color: #f1f5f9; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a;">
                    ${otp}
                  </div>
                </div>
                
                <p style="color: #334155; line-height: 1.6; margin-bottom: 20px;">
                  This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
                </p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                  <p style="color: #64748b; font-size: 14px; margin: 0;">
                    Sent at ${new Date().toLocaleString()}
                  </p>
                  <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">
                    From: E-Community <${process.env.CONTACT_EMAIL}>
                  </p>
                  <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">
                    © ${new Date().getFullYear()} E-Community. All rights reserved.
                  </p>
                  <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">
                    Las Piñas, Metro Manila, PH
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    console.log('OTP sent:', data?.id)
    return { success: true }
  } catch (error) {
    console.error('OTP sending error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Verify OTP
export async function verifyOTP(email: string, otp: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Find verification record
    const { data: verificationRecord, error: fetchError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('email', email)
      .eq('otp', otp)
      .single()
    
    if (fetchError || !verificationRecord) {
      return { success: false, error: 'Invalid or expired verification code' }
    }
    
    // Check if OTP is expired (10 minutes)
    const now = new Date()
    const expires = new Date(verificationRecord.expires_at)
    
    if (expires < now) {
      // Delete expired record
      await supabase
        .from('email_verifications')
        .delete()
        .eq('email', email)
        .eq('otp', otp)
      
      return { success: false, error: 'Verification code has expired' }
    }
    
    // OTP is valid - delete the record
    await supabase
      .from('email_verifications')
      .delete()
      .eq('email', email)
      .eq('otp', otp)
    
    return { success: true }
  } catch (error) {
    console.error('OTP verification error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}