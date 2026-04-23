import { Module } from '@nestjs/common';
import { JobPathLessonController } from './job_path_lesson.controller';
import { JobPathLessonService } from './job_path_lesson.service';
import { SupabaseModule } from '../../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [JobPathLessonController],
  providers: [JobPathLessonService],
})
export class JobPathLessonModule {}
