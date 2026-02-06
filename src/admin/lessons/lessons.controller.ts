import { Controller, Delete, Patch, Param, Body, Post, Get, Query } from '@nestjs/common';
import { LessonsService } from './lessons.service';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  createLesson(
    @Body()
    body: {
      title: string;
      course_id: number;
      lesson_order: number;
      duration?: number;
      external_url?: string;
    },
  ) {
    return this.lessonsService.createLesson(body);
  }

  @Get()
  getLessons(@Query('course_id') courseId?: string) {
    if (courseId) {
      return this.lessonsService.getLessonsByCourse(Number(courseId));
    }
    return this.lessonsService.getLessons();
  }

  @Get(':id')
  getLessonById(@Param('id') id: string) {
    return this.lessonsService.getLessonById(Number(id));
  }

  @Patch(':id')
  updateLesson(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      course_id?: number;
      lesson_order?: number;
      duration?: number;
      external_url?: string;
    },
  ) {
    return this.lessonsService.updateLesson(Number(id), body);
  }

  @Delete(':id')
  deleteLesson(@Param('id') id: string) {
    return this.lessonsService.deleteLesson(Number(id));
  }
}
