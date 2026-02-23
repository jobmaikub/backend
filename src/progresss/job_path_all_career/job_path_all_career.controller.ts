import { Controller, Get, Param } from '@nestjs/common';
import { JobPathAllCareerService } from './job_path_all_career.service';

@Controller('job-path-all-career')
export class JobPathAllCareerController {
  constructor(
    private readonly service: JobPathAllCareerService,
  ) {}

  @Get('user/:userId')
  getAllLearningPath(
    @Param('userId') userId: string,
  ) {
    return this.service.getAllLearningPath(Number(userId));
  }
}
