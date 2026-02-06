import { Module } from '@nestjs/common';
import { FacultiesController } from './faculties.controller';
import { FacultiesService } from './faculties.service';
import { SupabaseModule } from '../../supabase/supabase.module';

@Module({
  imports: [SupabaseModule], 
  controllers: [FacultiesController],
  providers: [FacultiesService],
})
export class FacultiesModule {}
