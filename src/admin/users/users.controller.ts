import { Controller, Delete, Patch, Param, Body, Post, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { SupabaseAuthGuard } from '../../auth/supabase-auth.guard';
import { AdminGuard } from '../../auth/admin.guard';

@Controller('users')
@UseGuards(SupabaseAuthGuard, AdminGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  createUser(@Body() body: any) {
    return this.usersService.createUser(body);
  }

  @Get()
  getUsers() {
    return this.usersService.getUsers();
  }

  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(+id);
  }

  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() body: any) {
    return this.usersService.updateUser(+id, body);
  }

  @Patch(':id/status')
  updateUserStatus(
    @Param('id') id: string,
    @Body('status') status: 'ban' | 'unban',
  ) {
    return this.usersService.updateUserStatus(+id, status);
  }

  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(+id);
  }
}
