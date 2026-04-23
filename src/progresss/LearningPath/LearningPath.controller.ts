import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { LearningPathService } from './LearningPath.service';

@Controller('learning-paths')
export class LearningPathController {
  constructor(private readonly service: LearningPathService) {}

  // 🔹 GET ALL (ต้องมี userId)
  @Get('user/:userId')
  getAllPaths(@Param('userId') userId: string) {
    return this.service.getAllPaths(userId);
  }

  // 🔹 GET DETAIL
  @Get('user/:userId/:careerId')
  getPathDetail(
    @Param('userId') userId: string,
    @Param('careerId', ParseIntPipe) careerId: number,
  ) {
    return this.service.getPathDetail(careerId, userId);
  }
}