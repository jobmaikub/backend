import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { BanUsersService } from './ban_users.service';

@Controller('admin/ban-users')
export class BanUsersController {
  constructor(private readonly service: BanUsersService) { }

  @Post()
  banUser(
    @Body()
    body: {
      user_id: number;
      reason: string;
      unban_date?: string;
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
    return this.service.getBansByUserId(Number(userId));
  }

  @Get('user/:userId/active')
  getActiveBan(@Param('userId') userId: string) {
    return this.service.getActiveBanByUserId(Number(userId));
  }

  @Get(':id')
  getBanById(@Param('id') id: string) {
    return this.service.getBanById(Number(id));
  }

  @Patch('user/:userId/unban')
  unbanUserByUserId(@Param('userId') userId: string) {
    return this.service.unbanUserByUserId(Number(userId));
  }

  @Delete(':id')
  deleteBan(@Param('id') id: string) {
    return this.service.deleteBan(Number(id));
  }
}
