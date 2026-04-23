import { Module } from '@nestjs/common';
import { JobPathAllCareerController } from './job_path_all_career.controller';
import { JobPathAllCareerService } from './job_path_all_career.service';
import { SupabaseModule } from '../../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [JobPathAllCareerController],
  providers: [JobPathAllCareerService],
})
export class JobPathAllCareerModule {}
