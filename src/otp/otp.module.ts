import { Module } from '@nestjs/common';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [OtpController],
  providers: [OtpService],
  exports: [OtpService], // เผื่อโมดูลอื่นอยากใช้ระบบ OTP ด้วย
})
export class OtpModule {}
