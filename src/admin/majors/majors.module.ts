import { Module } from '@nestjs/common';
import { MajorsController } from './majors.controller';
import { MajorsService } from './majors.service';
import { SupabaseModule } from '../../supabase/supabase.module';

@Module({
  imports: [SupabaseModule], 
  controllers: [MajorsController],
  providers: [MajorsService],
})
export class MajorsModule {}
