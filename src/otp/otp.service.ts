import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

@Injectable()
export class OtpService {
  private resend;
  private supabaseAdmin;
  private resendFromEmail;

  constructor(private readonly supabaseService: SupabaseService) {
    //  Validate env
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured');
      throw new Error('Missing RESEND_API_KEY environment variable');
    }

    if (!process.env.RESEND_FROM_EMAIL) {
      console.error('❌ RESEND_FROM_EMAIL not configured');
      throw new Error('Missing RESEND_FROM_EMAIL environment variable');
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Supabase credentials missing in .env');
      throw new Error('Missing Supabase environment variables');
    }

    //  Setup Resend
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.resendFromEmail = process.env.RESEND_FROM_EMAIL;

    //  Setup Supabase admin
    this.supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    console.log('OTP Service initialized successfully (Resend)');
  }

  // Generate 6-digit OTP
  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP or Link via Resend
  async sendOtpEmail(
    email: string,
    type: 'reset' | 'signup' | 'welcome' = 'reset',
    metadata?: any,
  ): Promise<boolean> {
    const code = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    try {
      console.log(`Sending ${type} email to ${email}`);

      let subject = 'OTP for Jobmaikub - forget password';
      let title = 'OTP for you';
      let description = 'This code will expire in 10 minutes';
      let actionLink = '';

      if (type === 'signup') {
        subject = 'Verify your email - Jobmaikub';
        title = 'Welcome to Jobmaikub! Please verify your email';
        description =
          'Click the button below to verify your account and start your journey.';

        // 1. Check if user already exists
        const {
          data: { users },
          error: listError,
        } = await this.supabaseAdmin.auth.admin.listUsers();
        const existingUser = users.find((u) => u.email === email);

        if (existingUser) {
          // Case A: User is already confirmed
          if (existingUser.email_confirmed_at) {
            console.log(`User ${email} is already confirmed.`);
            // We can either send a welcome email or just return false/error
            return false; // Or handle as special case
          }

          // Case B: User exists but not confirmed - Update password if provided and send magiclink
          if (metadata?.password) {
            await this.supabaseAdmin.auth.admin.updateUserById(
              existingUser.id,
              {
                password: metadata.password,
                user_metadata: { full_name: metadata.full_name || '' },
              },
            );
          }

          const { data: magicData, error: magicError } =
            await this.supabaseAdmin.auth.admin.generateLink({
              type: 'magiclink',
              email: email,
              options: {
                redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-success`,
              },
            });

          if (magicError) {
            console.error(
              '❌ Error generating magiclink for existing user:',
              magicError,
            );
            return false;
          }
          actionLink = magicData.properties.action_link;
        } else {
          // Case C: New user - create and generate signup link
          if (metadata?.password) {
            await this.supabaseAdmin.auth.admin.createUser({
              email: email,
              password: metadata.password,
              user_metadata: { full_name: metadata.full_name || '' },
              email_confirm: false,
            });
          }

          const { data: signupData, error: signupError } =
            await this.supabaseAdmin.auth.admin.generateLink({
              type: 'signup',
              email: email,
              options: {
                redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/home?verified=true`,
              },
            });

          if (signupError) {
            console.error('❌ Error generating signup link:', signupError);
            return false;
          }
          actionLink = signupData.properties.action_link;
        }
      } else if (type === 'welcome') {
        subject = 'Welcome to Jobmaikub!';
        title = 'Successfully joined Jobmaikub';
        description = 'We are excited to have you here!';
      }

      // Handle OTP storage for reset/signup (if signup still uses code fallback, but here we use link)
      if (type === 'reset') {
        await this.supabaseAdmin.from('otp_codes').delete().eq('email', email);

        const { error: insertError } = await this.supabaseAdmin
          .from('otp_codes')
          .insert({
            email,
            code,
            expires_at: expiresAt,
          });

        if (insertError) {
          console.error('❌ Database insert error:', insertError);
          return false;
        }
      }

      // SEND EMAIL WITH RESEND
      try {
        await this.resend.emails.send({
          from: this.resendFromEmail,
          to: email,
          replyTo: process.env.GMAIL_USER || 'jobmaikub@gmail.com',
          subject: subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; background: #f8f9fa; padding: 20px; border-radius: 8px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #2563eb; margin: 0;">Jobmaikub</h2>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">${title}</p>

                ${
                  type === 'signup' && actionLink
                    ? `
                  <a href="${actionLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0;">
                    Verify Email
                  </a>
                `
                    : ''
                }

                ${
                  type === 'reset'
                    ? `
                  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <div style="letter-spacing: 8px; font-size: 32px; color: #2563eb; font-weight: bold; font-family: monospace;">
                      ${code}
                    </div>
                  </div>
                `
                    : ''
                }

                <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">${description}</p>
              </div>
              
              <p style="text-align:center; font-size:12px; color: #9ca3af; margin-top: 20px;">
                © 2024 Jobmaikub. All rights reserved.
              </p>
            </div>
          `,
        });

        console.log(`${type} email sent via Resend to ${email}`);
      } catch (mailError) {
        console.warn('Email send failed:', mailError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
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
        .single();

      if (error || !data) return false;

      console.log(`OTP verified for ${email}`);
      return true;
    } catch {
      return false;
    }
  }

  async checkOtpValid(email: string, code: string): Promise<boolean> {
    return this.verifyOtp(email, code);
  }

  async deleteOtp(email: string, code: string): Promise<void> {
    await this.supabaseAdmin
      .from('otp_codes')
      .delete()
      .eq('email', email)
      .eq('code', code);

    console.log(`OTP deleted for ${email}`);
  }

  async updateUserPassword(
    email: string,
    newPassword: string,
  ): Promise<boolean> {
    try {
      const {
        data: { users },
      } = await this.supabaseAdmin.auth.admin.listUsers();

      const user = users.find((u) => u.email === email);
      if (!user) return false;

      const { error } = await this.supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          password: newPassword,
        },
      );

      return !error;
    } catch {
      return false;
    }
  }
}
