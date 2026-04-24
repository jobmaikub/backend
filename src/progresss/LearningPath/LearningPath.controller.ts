import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { LearningPathService } from './LearningPath.service';

@Controller('learning-paths')
export class LearningPathController {
  constructor(private readonly learningPathService: LearningPathService) {}

  @Get()
  getLearningPaths(@Query('user_id') userId: string) {
    if (!userId) {
      throw new BadRequestException('user_id is required');
    }

    return this.learningPathService.getLearningPaths(userId);
  }
}