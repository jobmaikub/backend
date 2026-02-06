import { Module } from '@nestjs/common';
import { BanUsersController } from './ban_users.controller';
import { BanUsersService } from './ban_users.service';
import { SupabaseModule } from '../../supabase/supabase.module';

@Module({
  imports: [SupabaseModule], 
  controllers: [BanUsersController],
  providers: [BanUsersService],
})
export class BanUsersModule {}
