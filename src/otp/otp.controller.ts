import { Controller, Post, Body } from '@nestjs/common';
import { OtpService } from './otp.service';

@Controller('otp')
export class OtpController {
  constructor(private otpService: OtpService) {}

  @Post('send')
  async sendOtp(
    @Body()
    body: {
      email: string;
      type?: 'reset' | 'signup' | 'welcome';
      password?: string;
      full_name?: string;
    },
  ) {
    try {
      const success = await this.otpService.sendOtpEmail(
        body.email,
        body.type,
        {
          password: body.password,
          full_name: body.full_name,
        },
      );
      if (!success) {
        return { success: false, error: 'Failed to send email' };
      }
      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('verify')
  async verifyOtp(@Body() body: { email: string; code: string }) {
    try {
      const isValid = await this.otpService.verifyOtp(body.email, body.code);
      if (!isValid) {
        return { success: false, error: 'Invalid or expired OTP' };
      }
      return { success: true, message: 'OTP verified' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('reset-password')
  async resetPassword(
    @Body() body: { email: string; password: string; code: string },
  ) {
    try {
      console.log(`📝 Reset password request for: ${body.email}`);

      // Verify OTP without deleting (just check if valid)
      const isValid = await this.otpService.checkOtpValid(
        body.email,
        body.code,
      );
      if (!isValid) {
        console.log(`❌ OTP invalid or expired`);
        return { success: false, error: 'Invalid or expired OTP' };
      }

      console.log(`✅ OTP verified, updating password...`);

      // Then update password
      const updated = await this.otpService.updateUserPassword(
        body.email,
        body.password,
      );
      if (!updated) {
        console.log(`❌ Password update failed in service`);
        return {
          success: false,
          error: 'Failed to update password - check backend logs',
        };
      }

      // Delete OTP after successful password update
      await this.otpService.deleteOtp(body.email, body.code);

      console.log(`✅ Password reset successful for ${body.email}`);
      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Reset password error:`, errorMsg);
      return { success: false, error: `Error: ${errorMsg}` };
    }
  }
}
