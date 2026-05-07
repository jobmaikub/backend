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
  getAllCareers(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.homeService.getAllCareers(
      limit ? Number(limit) : 100,
      offset ? Number(offset) : 0,
    );
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
