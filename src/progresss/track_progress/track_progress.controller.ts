
import { Controller, Get } from '@nestjs/common';
import { TrackProgressService } from './track_progress.service';

@Controller('track-progress')
export class TrackProgressController {
  constructor(
    private readonly trackProgressService: TrackProgressService,
  ) {}

  // 🔥 FIX USER ID ตรงนี้
  private userId = '6b9560eb-8970-47ae-a5fc-81f5a7e96b98';

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