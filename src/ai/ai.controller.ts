import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('faculties')
  async getFaculties(@Query('search') search?: string) {
    return this.aiService.getFaculties(search || '');
  }

  @Get('majors/:facultyId')
  async getMajors(@Param('facultyId') facultyId: number) {
    return this.aiService.getMajors(facultyId);
  }

  @Get('skills')
  async getSkills(@Query('search') search?: string) {
    return this.aiService.getSkills(search || '');
  }

  @Get('interests')
  async getInterests(@Query('search') search?: string) {
    return this.aiService.getInterests(search || '');
  }

  @Get('careers/:id')
  async getCareerDetails(@Param('id') careerId: number) {
    return this.aiService.getCareerById(careerId);
  }

  @Post('match')
  async aiMatch(@Body() user) {
    return this.aiService.getCareerMatch(user);
  }

  @Get('history/:userId')
  async getHistory(@Param('userId') userId: string) {
    return this.aiService.getLatestMatches(userId);
  }
}
