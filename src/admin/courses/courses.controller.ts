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

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  createCourse(
    @Body()
    body: {
      title?: string;
      description?: string;
      career_path?: any;
      level?: any;
      duration?: number;
      external_url?: string;
      course_order?: number;
      skills_taught?: string[];
      learning_outcome?: string; // ✅ เพิ่ม
    },
  ) {
    console.log("CREATE COURSE BODY:", body);
    return this.coursesService.createCourse(body);
  }

  @Get()
  getCourses(
    @Query('career_path') career_path?: string,
    @Query('level') level?: string,
  ) {
    // future filter
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
      career_path?: any;
      level?: any;
      duration?: number;
      external_url?: string;
      course_order?: number;
      skills_taught?: string[];
      learning_outcome?: string; // ✅ เพิ่ม
    },
  ) {
    return this.coursesService.updateCourse(Number(id), body);
  }

  @Delete(':id')
  deleteCourse(@Param('id') id: string) {
    return this.coursesService.deleteCourse(Number(id));
  }
}
