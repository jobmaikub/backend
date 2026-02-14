import {
  Controller,
  Delete,
  Patch,
  Param,
  Body,
  Post,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { CareersService } from './careers.service';

@Controller('careers')
export class CareersController {
  constructor(private readonly careersService: CareersService) {}

  // ===== CREATE =====
  @Post()
  createCareer(
    @Body()
    body: {
      title: string;
      description: string;
      industry_id: number;

      minSalary?: number;
      maxSalary?: number;
      growth?: number;
      image?: string;

      required_skills?: string[];
      responsibilities?: string[];
      interest: string;
    },
  ) {
    if (!body.industry_id) {
      throw new BadRequestException('industry_id is required');
    }

    if (!body.interest?.trim()) {
      throw new BadRequestException('interest is required');
    }

    return this.careersService.createCareer({
      title: body.title,
      description: body.description,
      industry_id: body.industry_id,

      min_salary: body.minSalary,
      max_salary: body.maxSalary,
      growth_rate: body.growth,
      image_url: body.image,

      required_skills: body.required_skills,
      responsibilities: body.responsibilities,
      interest: body.interest.trim(),
    });
  }

  // ===== GET ALL =====
  @Get()
  getCareers(@Query('industry_id') industryId?: string) {
    if (industryId) {
      return this.careersService.getCareersByIndustry(
        Number(industryId),
      );
    }
    return this.careersService.getCareers();
  }

  // ===== GET BY ID =====
  @Get(':id')
  getCareerById(@Param('id') id: string) {
    return this.careersService.getCareerById(Number(id));
  }

  // ===== UPDATE =====
  @Patch(':id')
  updateCareer(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      industry_id?: number;

      minSalary?: number;
      maxSalary?: number;
      growth?: number;
      image?: string;

      required_skills?: string[];
      responsibilities?: string[];
      interest?: string;
    },
  ) {
    return this.careersService.updateCareer(Number(id), {
      ...(body.title && { title: body.title }),
      ...(body.description && { description: body.description }),
      ...(body.industry_id && { industry_id: body.industry_id }),

      ...(body.minSalary !== undefined && {
        min_salary: body.minSalary,
      }),
      ...(body.maxSalary !== undefined && {
        max_salary: body.maxSalary,
      }),
      ...(body.growth !== undefined && {
        growth_rate: body.growth,
      }),
      ...(body.image && {
        image_url: body.image,
      }),
      ...(body.required_skills && {
        required_skills: body.required_skills,
      }),
      ...(body.responsibilities && {
        responsibilities: body.responsibilities,
      }),
      ...(body.interest && {
        interest: body.interest.trim(),
      }),
    });
  }

  // ===== DELETE =====
  @Delete(':id')
  deleteCareer(@Param('id') id: string) {
    return this.careersService.deleteCareer(Number(id));
  }
}
