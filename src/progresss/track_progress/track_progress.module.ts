import { Module } from '@nestjs/common';
import { TrackProgressController } from './track_progress.controller';
import { TrackProgressService } from './track_progress.service';
import { SupabaseModule } from '../../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [TrackProgressController],
  providers: [TrackProgressService],
  exports: [TrackProgressService],
})
export class TrackProgressModule {}
