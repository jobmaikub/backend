import { Controller, Get, Param, Patch } from '@nestjs/common';
import { JobPathLessonService } from './job_path_lesson.service';

@Controller('job-path-lesson')
export class JobPathLessonController {
  constructor(private readonly service: JobPathLessonService) {}

  // 1️⃣ get_course
  @Get('user/:userId/courses')
  getCourse(@Param('userId') userId: string) {
    return this.service.getCourse(Number(userId));
  }

  // 2️⃣ get_skill
  @Get('user/:userId/course/:courseId/skills')
  getSkill(
    @Param('userId') userId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.service.getSkill(
      Number(userId),
      Number(courseId),
    );
  }

  // 3️⃣ get_all_lesson
  @Get('user/:userId/lessons')
  getAllLesson(@Param('userId') userId: string) {
    return this.service.getAllLesson(Number(userId));
  }

  // 4️⃣ lesson_done
  @Patch('user/:userId/lesson/:lessonId/done')
  lessonDone(
    @Param('userId') userId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.service.lessonDone(
      Number(userId),
      Number(lessonId),
    );
  }
}
