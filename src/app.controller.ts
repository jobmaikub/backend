import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { AppService } from './app.service';
import { SupabaseService } from './supabase/supabase.service';
import { ReviewsService } from './admin/reviews/reviews.service';
import { TrackProgressService } from './progresss/track_progress/track_progress.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly supabaseService: SupabaseService,
    private readonly reviewsService: ReviewsService,
    private readonly trackProgressService: TrackProgressService,
  ) {}

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
      .select(
        'id, email, full_name, avatar_url, skills_mastered, joined_at, courses_completed, current_streak, total_learning_hours',
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Supabase error fetching public profile:', error);
      throw new NotFoundException('User not found');
    }

    return data;
  }

  @Get('user-dashboard/:id')
  async getUserDashboard(@Param('id') id: string) {
    try {
      // console.log(`[Dashboard] Fetching data for user: ${id}`);
      const [profileRes, skills, reviews] = await Promise.all([
        this.supabaseService.client
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single(),
        this.trackProgressService.getEnrichedSkills(id),
        this.reviewsService.getReviewsByUser(id),
      ]);

      if (profileRes.error || !profileRes.data) {
        console.error(`[Dashboard] Profile error for ${id}:`, profileRes.error);
        throw new NotFoundException('User profile not found');
      }

      // console.log(`[Dashboard] Found ${skills?.length || 0} skills and ${reviews?.length || 0} reviews for ${id}`);

      return {
        profile: profileRes.data,
        skills: skills || [],
        reviews: reviews || [],
      };
    } catch (error) {
      console.error(`[Dashboard] Error for ${id}:`, error);
      throw error;
    }
  }
}
