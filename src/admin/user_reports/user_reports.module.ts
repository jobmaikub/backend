import { Module } from '@nestjs/common';
import { UserReportsController } from './user_reports.controller';
import { UserReportsService } from './user_reports.service';
import { SupabaseModule } from '../../supabase/supabase.module';

@Module({
  imports: [SupabaseModule], 
  controllers: [UserReportsController],
  providers: [UserReportsService],
})
export class UserReportsModule {}
