import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { CoursesService } from './courses.service';

@Controller('admin/courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  createCourse(
    @Body()
    body: {
      title?: string;
      description?: string;
      career_path?: string;
      level?: string;
      duration_mins?: number;
      course_order?: number;
      skills_taught?: string[];
      learning_outcome?: string[];
      career_id?: number;
      image_url?: string;
    },
  ) {
    return this.coursesService.createCourse(body);
  }

  @Get()
  getCourses(
    @Query('career_id') career_id?: string,
    @Query('level') level?: string,
  ) {
    return this.coursesService.getCourses();
  }

  @Get(':id')
  getCourseById(@Param('id') id: string) {
    return this.coursesService.getCourseById(Number(id));
  }

  @Patch(':id')
  updateCourse(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      career_path?: string;
      level?: string;
      duration_mins?: number;
      course_order?: number;
      skills_taught?: string[];
      learning_outcome?: string[];
      career_id?: number;
      image_url?: string;
    },
  ) {
    return this.coursesService.updateCourse(Number(id), body);
  }

  @Delete(':id')
  deleteCourse(@Param('id') id: string) {
    return this.coursesService.deleteCourse(Number(id));
  }
}
