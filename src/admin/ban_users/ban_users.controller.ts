import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { BanUsersService } from './ban_users.service';
import { SupabaseAuthGuard } from '../../auth/supabase-auth.guard';
import { AdminGuard } from '../../auth/admin.guard';

@Controller('admin/ban-users')
@UseGuards(SupabaseAuthGuard, AdminGuard)
export class BanUsersController {
  constructor(private readonly service: BanUsersService) {}

  @Post()
  banUser(
    @Body()
    body: {
      user_id: string;
      reason: string;
      unban_date?: string;
      created_by?: string;
    },
  ) {
    return this.service.banUser(body);
  }

  @Get()
  getBans() {
    return this.service.getBans();
  }

  @Get('user/:userId')
  getBansByUserId(@Param('userId') userId: string) {
    return this.service.getBansByUserId(userId);
  }

  @Get('user/:userId/active')
  getActiveBan(@Param('userId') userId: string) {
    return this.service.getActiveBanByUserId(userId);
  }

  @Get(':banId')
  getBanById(@Param('banId') banId: string) {
    return this.service.getBanById(banId);
  }

  @Patch('user/:userId/unban')
  unbanUserByUserId(@Param('userId') userId: string) {
    return this.service.unbanUserByUserId(userId);
  }

  @Delete(':banId')
  deleteBan(@Param('banId') banId: string) {
    return this.service.deleteBan(banId);
  }
}
