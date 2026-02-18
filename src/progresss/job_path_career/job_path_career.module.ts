import { Module } from '@nestjs/common';
import { JobPathCareerController } from './job_path_career.controller';
import { JobPathCareerService } from './job_path_career.service';
import { SupabaseModule } from '../../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [JobPathCareerController],
  providers: [JobPathCareerService],
})
export class JobPathCareerModule {}
