import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { AppService } from './app.service';
import { SupabaseService } from './supabase/supabase.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly supabaseService: SupabaseService,
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('public-profile/:id')
  async getPublicProfile(@Param('id') id: string) {
    const { data, error } = await this.supabaseService.client
      .from('profiles')
      .select('id, email, full_name, avatar_url, skills_mastered, joined_at, courses_completed, current_streak, total_learning_hours')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Supabase error fetching public profile:', error);
      throw new NotFoundException('User not found');
    }

    return data;
  }
}
