import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
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

  @Post('start')
  startLearningPath(
    @Body('user_id') userId: string,
    @Body('career_id') careerId: number,
  ) {
    if (!userId || !careerId) {
      throw new BadRequestException('user_id and career_id are required');
    }
    return this.learningPathService.startLearningPath(userId, careerId);
  }

  @Get(':career_id/courses')
  getCareerCourses(
    @Param('career_id', ParseIntPipe) careerId: number,
    @Query('user_id') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('user_id is required');
    }
    return this.learningPathService.getCareerCourses(userId, careerId);
  }

  @Get('courses/:course_id/lessons')
  getCourseLessons(
    @Param('course_id', ParseIntPipe) courseId: number,
    @Query('user_id') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('user_id is required');
    }
    return this.learningPathService.getCourseLessons(userId, courseId);
  }

  @Post('lessons/:lesson_id/complete')
  completeLesson(
    @Param('lesson_id', ParseIntPipe) lessonId: number,
    @Body('user_id') userId: string,
    @Body('done') done: boolean,
  ) {
    if (!userId) {
      throw new BadRequestException('user_id is required');
    }
    return this.learningPathService.completeLesson(userId, lessonId, done);
  }

  @Post('courses/:course_id/complete')
  completeCourse(
    @Param('course_id', ParseIntPipe) courseId: number,
    @Body('user_id') userId: string,
    @Body('done') done: boolean,
  ) {
    if (!userId) {
      throw new BadRequestException('user_id is required');
    }
    return this.learningPathService.completeCourse(userId, courseId, done);
  }

  @Post('lessons/bulk-update')
  bulkUpdateLessons(
    @Body('user_id') userId: string,
    @Body('updates') updates: { lesson_id: number; done: boolean }[],
  ) {
    if (!userId) {
      throw new BadRequestException('user_id is required');
    }
    return this.learningPathService.bulkUpdateLessons(userId, updates);
  }

  @Delete(':career_id')
  deleteLearningPath(
    @Param('career_id', ParseIntPipe) careerId: number,
    @Query('user_id') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('user_id is required');
    }
    return this.learningPathService.deleteLearningPath(userId, careerId);
  }
}
