import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { TrackProgressService } from './track_progress.service';
import { SupabaseAuthGuard } from '../../auth/supabase-auth.guard';

@Controller('track-progress')
@UseGuards(SupabaseAuthGuard)
export class TrackProgressController {
  constructor(private readonly trackProgressService: TrackProgressService) {}

  @Get('stats')
  getStats(@Req() req: any) {
    return this.trackProgressService.getStats(
      req.user.id,
      req.profile?.user_id,
    );
  }

  @Get('completed-courses')
  getCompletedCourses(@Req() req: any) {
    return this.trackProgressService.getCompletedCourses(
      req.profile?.user_id ?? req.user.id,
    );
  }

  @Get('activity')
  getActivity(@Req() req: any) {
    return this.trackProgressService.getActivityHeatmap(
      req.profile?.user_id ?? req.user.id,
    );
  }

  @Get('skills')
  getEnrichedSkills(@Req() req: any) {
    return this.trackProgressService.getEnrichedSkills(
      req.profile?.user_id ?? req.user.id,
    );
  }
}
