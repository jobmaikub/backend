import {
  Controller,
  Delete,
  Patch,
  Param,
  Body,
  Post,
  Get,
  Query,
} from '@nestjs/common';
import { NewsService } from './news.service';

@Controller('admin/news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  createNews(
    @Body()
    body: {
      title: string;
      description: string;
      industry_id?: number;
      image_url: string;
      source_url: string;
      source_name: string;
      date?: string;
    },
  ) {
    return this.newsService.createNews(body);
  }

  @Get()
  getNews() {
    return this.newsService.getNews();
  }

  @Get('search/query')
  searchNews(@Query('q') query: string, @Query('industry') industry?: string) {
    return this.newsService.searchNews(query, industry);
  }

  @Get(':id')
  getNewsById(@Param('id') id: string) {
    return this.newsService.getNewsById(Number(id));
  }

  @Patch(':id')
  updateNews(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      industry_id?: number;
      image_url?: string;
      source_url?: string;
      source_name?: string;
      date?: string;
    },
  ) {
    return this.newsService.updateNews(Number(id), body);
  }

  @Delete(':id')
  deleteNews(@Param('id') id: string) {
    return this.newsService.deleteNews(Number(id));
  }
}
