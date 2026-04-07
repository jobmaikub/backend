import { Controller, Get, Param } from '@nestjs/common';
import { IndustriesService } from './industries.service';

@Controller('admin/industries')
export class IndustriesController {
  constructor(private readonly industriesService: IndustriesService) {}

  @Get()
  getIndustries() {
    return this.industriesService.getIndustries();
  }

  @Get(':id')
  getIndustryById(@Param('id') id: string) {
    return this.industriesService.getIndustryById(Number(id));
  }
}
