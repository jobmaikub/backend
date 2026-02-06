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

const INDUSTRY_MAP: Record<string, string> = {
  technology: 'Technology',
  'design & creative': 'Design & Creative',
  'business & management': 'Business & Management',
  healthcare: 'Healthcare',
  marketing: 'Marketing',
};

function normalizeIndustry(industry?: string): string {
  if (!industry) {
    throw new BadRequestException('industry is required');
  }

  const normalized = INDUSTRY_MAP[industry.trim().toLowerCase()];
  if (!normalized) {
    throw new BadRequestException('invalid industry');
  }

  return normalized;
}

@Controller('careers')
export class CareersController {
  constructor(private readonly careersService: CareersService) { }

  // ===== CREATE =====
  @Post()
  createCareer(
    @Body()
    body: {
      title: string;
      description: string;
      industry: string;

      minSalary?: number;
      maxSalary?: number;
      growth?: number;
      image?: string;

      required_skills?: string[];
      responsibilities?: string[];
      interest: string;
    },
  ) {
    if (!body.interest || !body.interest.trim()) {
      throw new BadRequestException('interest is required');
    }

    return this.careersService.createCareer({
      title: body.title,
      description: body.description,
      industry: normalizeIndustry(body.industry),

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

      interest: body.interest.trim(),
    });
  }

  // ===== GET ALL / BY INDUSTRY =====
  @Get()
  getCareers(@Query('industry') industry?: string) {
    if (industry) {
      return this.careersService.getCareersByIndustry(
        normalizeIndustry(industry),
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
      industry?: string;

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
      ...(body.industry && {
        industry: normalizeIndustry(body.industry),
      }),
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
