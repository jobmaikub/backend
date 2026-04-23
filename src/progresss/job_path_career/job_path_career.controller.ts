import { Controller, Get, Delete, Param } from '@nestjs/common';
import { JobPathCareerService } from './job_path_career.service';

@Controller('job-path-career')
export class JobPathCareerController {
  constructor(private readonly service: JobPathCareerService) {}

  // 1 user_id + 1 user_progress_career
  @Get('user/:userId/career/:careerId')
  getLearningPath(
    @Param('userId') userId: string,
    @Param('careerId') careerId: string,
  ) {
    return this.service.getLearningPath(
      Number(userId),
      Number(careerId),
    );
  }

  // 1 user_id ทุก user_progress_course
  @Get('user/:userId/courses')
  getAllCourse(
    @Param('userId') userId: string,
  ) {
    return this.service.getAllCourse(Number(userId));
  }

  // delete 1 user_id + 1 user_progress_career
  @Delete('user/:userId/career/:careerId')
  deleteLearningPath(
    @Param('userId') userId: string,
    @Param('careerId') careerId: string,
  ) {
    return this.service.deleteLearningPath(
      Number(userId),
      Number(careerId),
    );
  }
}
