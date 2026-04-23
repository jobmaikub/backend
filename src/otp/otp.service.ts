import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

@Injectable()
export class OtpService {
  private resend
  private supabaseAdmin
  private resendFromEmail

  constructor(private readonly supabaseService: SupabaseService) {
    //  Validate env
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured')
      throw new Error('Missing RESEND_API_KEY environment variable')
    }

    if (!process.env.RESEND_FROM_EMAIL) {
      console.error('❌ RESEND_FROM_EMAIL not configured')
      throw new Error('Missing RESEND_FROM_EMAIL environment variable')
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Supabase credentials missing in .env')
      throw new Error('Missing Supabase environment variables')
    }

    //  Setup Resend
    this.resend = new Resend(process.env.RESEND_API_KEY)
    this.resendFromEmail = process.env.RESEND_FROM_EMAIL

    //  Setup Supabase admin
    this.supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    console.log('OTP Service initialized successfully (Resend)')
  }

  // Generate 6-digit OTP
  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // Send OTP via Resend
  async sendOtpEmail(email: string): Promise<boolean> {
    const code = this.generateOtp()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    try {
      console.log(`Sending OTP to ${email}`)

      // Delete old OTP
      await this.supabaseAdmin
        .from('otp_codes')
        .delete()
        .eq('email', email)

      // Insert new OTP
      const { error: insertError } = await this.supabaseAdmin
        .from('otp_codes')
        .insert({
          email,
          code,
          expires_at: expiresAt,
        })

      if (insertError) {
        console.error('❌ Database insert error:', insertError)
        return false
      }

      console.log(` OTP stored in DB: ${code}`)

      // SEND EMAIL WITH RESEND (แทน Gmail เดิม)
      try {
        await this.resend.emails.send({
          from: this.resendFromEmail,
          to: email,
          replyTo: process.env.GMAIL_USER || 'jobmaikub@gmail.com',
          subject: 'OTP for Jobmaikub - forget password',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h2 style="color: #2563eb; text-align: center;">Jobmaikub</h2>
              <p style="text-align: center;">OTP for you</p>

              <div style="background: white; padding: 30px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <div style="letter-spacing: 8px; font-size: 40px; color: #2563eb; font-weight: bold; font-family: monospace;">
                  ${code}
                </div>
              </div>

              <p style="text-align:center; font-size:14px;">This code will expire in 10 minutes</p>
            </div>
          `,
        })

        console.log(`OTP email sent via Resend to ${email}`)
      } catch (mailError) {
        console.warn('Email send failed:', mailError)
      }

      return true
    } catch (error) {
      console.error('OTP send error:', error)
      return false
    }
  }

  // Verify OTP
  async verifyOtp(email: string, code: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseAdmin
        .from('otp_codes')
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error || !data) return false

      console.log(`OTP verified for ${email}`)
      return true
    } catch {
      return false
    }
  }

  async checkOtpValid(email: string, code: string): Promise<boolean> {
    return this.verifyOtp(email, code)
  }

  async deleteOtp(email: string, code: string): Promise<void> {
    await this.supabaseAdmin
      .from('otp_codes')
      .delete()
      .eq('email', email)
      .eq('code', code)

    console.log(`OTP deleted for ${email}`)
  }

  async updateUserPassword(email: string, newPassword: string): Promise<boolean> {
    try {
      const { data: { users } } =
        await this.supabaseAdmin.auth.admin.listUsers()

      const user = users.find(u => u.email === email)
      if (!user) return false

      const { error } =
        await this.supabaseAdmin.auth.admin.updateUserById(user.id, {
          password: newPassword,
        })

      return !error
    } catch {
      return false
    }
  }
}
