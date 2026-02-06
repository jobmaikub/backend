import { Controller, Delete, Patch, Param, Body, Post, Get } from '@nestjs/common';
import { MajorsService } from './majors.service';
import { ParseIntPipe } from '@nestjs/common';

@Controller('majors')
export class MajorsController {
  constructor(private readonly service: MajorsService) {}

  @Post()
  create(
    @Body()
    body: {
      name: string;
      name_th?: string;
      description?: string;
      faculty_id: number;
    }
  ) {
    return this.service.create(body);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      name?: string;
      name_th?: string;
      description?: string;
      faculty_id?: number;
    }
  ) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
