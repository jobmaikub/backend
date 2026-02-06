import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { SupabaseModule } from '../../supabase/supabase.module';

@Module({
  imports: [SupabaseModule], 
  controllers: [LessonsController],
  providers: [LessonsService],
})
export class LessonsModule {}
