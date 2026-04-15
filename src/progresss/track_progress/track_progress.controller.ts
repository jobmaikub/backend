
import { Controller, Get } from '@nestjs/common';
import { TrackProgressService } from './track_progress.service';

@Controller('track-progress')
export class TrackProgressController {
  constructor(
    private readonly trackProgressService: TrackProgressService,
  ) {}

  // 🔥 FIX USER ID ตรงนี้
  private userId = '8c995f8e-b515-485d-9d4a-435440076123';

  @Get('stats')
  getStats() {
    return this.trackProgressService.getStats(this.userId);
  }

  @Get('completed-courses')
  getCompletedCourses() {
    return this.trackProgressService.getCompletedCourses(
      this.userId,
    );
  }

  @Get('activity')
  getActivity() {
    return this.trackProgressService.getActivityHeatmap(
      this.userId,
    );
  }
}