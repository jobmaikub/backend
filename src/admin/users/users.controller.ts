import {
  Controller,
  Patch,
  Param,
  Body,
  Post,
  Get,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { SupabaseAuthGuard } from '../../auth/supabase-auth.guard';
import { AdminGuard } from '../../auth/admin.guard';

@Controller('admin/users')
@UseGuards(SupabaseAuthGuard, AdminGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getUsers() {
    return this.usersService.getUsers();
  }

  @Get(':userId')
  getUserById(@Param('userId') userId: string) {
    return this.usersService.getUserById(userId);
  }

  @Post(':userId/ban')
  banUser(@Param('userId') userId: string, @Body('reason') reason: string) {
    return this.usersService.banUser(userId, reason);
  }

  @Patch(':userId/unban')
  unbanUser(@Param('userId') userId: string) {
    return this.usersService.unbanUser(userId);
  }

  @Get(':userId/ban-history')
  getUserBans(@Param('userId') userId: string) {
    return this.usersService.getUserBans(userId);
  }

  @Get(':userId/reports')
  getUserReports(@Param('userId') userId: string) {
    return this.usersService.getUserReports(userId);
  }
}
