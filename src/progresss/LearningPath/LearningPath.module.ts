import { Module } from '@nestjs/common';
import { LearningPathController } from './LearningPath.controller';
import { LearningPathService } from './LearningPath.service';
import { SupabaseModule } from '../../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [LearningPathController],
  providers: [LearningPathService],
})
export class LearningPathModule {}
