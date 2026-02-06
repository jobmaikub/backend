import { Controller, Delete, Patch, Param, Body, Post, Get } from '@nestjs/common';
import { SkillsService } from './skills.service';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) { }

  @Post()
  createSkill(
    @Body()
    body: {
      name: string;
      category: {
        faculty_id: number;
        major_id: number;
      };
      icon?: string;
    },
  ) {
    return this.skillsService.createSkill(body);
  }

  @Get()
  getSkills() {
    return this.skillsService.getSkills();
  }

  @Get(':id')
  getSkillById(@Param('id') id: string) {
    return this.skillsService.getSkillById(Number(id));
  }

  @Patch(':id')
  updateSkill(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      category?: {
        faculty_id: number;
        major_id: number;
      };
      icon?: string;
    },
  ) {
    return this.skillsService.updateSkill(Number(id), body);
  }

  @Delete(':id')
  deleteSkill(@Param('id') id: string) {
    return this.skillsService.deleteSkill(Number(id));
  }
}
