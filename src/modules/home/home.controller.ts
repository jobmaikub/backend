import { Controller, Get, Param, Query } from '@nestjs/common';
import { HomeService } from './home.service';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  getHomeData() {
    return this.homeService.getHomeData();
  }

  @Get('trending-careers')
  getTrendingCareers() {
    return this.homeService.getTrendingCareers();
  }

  @Get('all-careers')
  getAllCareers() {
    return this.homeService.getAllCareers();
  }

  @Get('careers/:id')
  getCareerById(@Param('id') id: string) {
    return this.homeService.getCareerById(Number(id));
  }

  @Get('industry-news')
  getIndustryNews(
    @Query('limit') limit?: string,
    @Query('industry') industry?: string,
  ) {
    return this.homeService.getIndustryNews(
      limit ? Number(limit) : 10,
      industry,
    );
  }

  @Get('industries')
  getIndustries() {
    return this.homeService.getIndustries();
  }
}
