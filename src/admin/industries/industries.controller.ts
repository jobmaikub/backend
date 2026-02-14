import { Controller, Get } from '@nestjs/common';
import { IndustriesService } from './industries.service';

@Controller('industries')
export class IndustriesController {
  constructor(private readonly industriesService: IndustriesService) {}

  @Get()
  getIndustries() {
    return this.industriesService.getIndustries();
  }
}
