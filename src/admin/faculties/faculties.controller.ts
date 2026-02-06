import { Controller, Delete, Patch, Param, Body, Post, Get } from '@nestjs/common';
import { FacultiesService } from './faculties.service';

@Controller('faculties')
export class FacultiesController {
  constructor(private readonly facultiesService: FacultiesService) {}

  @Post()
  createFaculty(
    @Body()
    body: {
      name: string;
      name_th?: string;
      icon?: string;
      theme_color?: string;
    },
  ) {
    return this.facultiesService.createFaculty(body);
  }

  @Get()
  getFaculties() {
    return this.facultiesService.getFaculties();
  }

  @Get(':id')
  getFacultyById(@Param('id') id: string) {
    return this.facultiesService.getFacultyById(Number(id));
  }

  @Patch(':id')
  updateFaculty(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      name_th?: string;
      icon?: string;
      theme_color?: string;
    },
  ) {
    return this.facultiesService.updateFaculty(Number(id), body);
  }

  @Delete(':id')
  deleteFaculty(@Param('id') id: string) {
    return this.facultiesService.deleteFaculty(Number(id));
  }
}
