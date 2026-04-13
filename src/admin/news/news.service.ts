import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class NewsService {
  constructor(
    private readonly supabaseService: SupabaseService,
  ) {}

  async createNews(data: {
    title: string;
    description: string;
    industry_id: number;
    image_url: string;
    source_url: string;
    source_name: string;
  }) {
    const { data: result, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('news')
        .insert(data)
        .select()
        .single();

    if (error) throw new BadRequestException(error.message);
    return result;
  }

  async getNews() {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('news')
        .select('*, industry:industry_id(name)')
        .order('news_id', { ascending: true });

    if (error) throw new NotFoundException(error.message);
    return data;
  }

  async searchNews(query: string, industry?: string) {
    if (!query || query.trim() === '') {
      return this.getNews();
    }

    // Get all news with industry info, then filter in memory
    // This is simpler than trying to do complex OR queries in Supabase
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('news')
        .select('*, industry:industry_id(name)')
        .order('news_id', { ascending: true });

    if (error) throw new NotFoundException(error.message);

    // Filter in memory
    const searchLower = query.toLowerCase();
    let filtered = data.filter((article: any) =>
      (article.title?.toLowerCase() || '').includes(searchLower) ||
      (article.source_name?.toLowerCase() || '').includes(searchLower) ||
      (article.description?.toLowerCase() || '').includes(searchLower) ||
      (article.industry?.name?.toLowerCase() || '').includes(searchLower)
    );

    // Optional: filter by industry
    if (industry && industry !== 'All Industries') {
      filtered = filtered.filter(
        (article: any) => article.industry?.name === industry
      );
    }

    return filtered;
  }

  async getNewsById(newsId: number) {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('news')
        .select('*, industry:industry_id(name)')
        .eq('news_id', newsId)
        .single();

    if (error || !data) {
      throw new NotFoundException('News not found');
    }

    return data;
  }

  async updateNews(
    newsId: number,
    data: {
      title?: string;
      description?: string;
      industry_id?: number;
      image_url?: string;
      source_url?: string;
      source_name?: string;
    },
  ) {
    const { data: result, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('news')
        .update(data)
        .eq('news_id', newsId)
        .select('*, industry:industry_id(name)')
        .single();

    if (error || !result) {
      throw new NotFoundException(
        error?.message || 'News not found',
      );
    }

    return result;
  }

  async deleteNews(newsId: number) {
    const { error } =
      await this.supabaseService.client
        .schema('admin')
        .from('news')
        .delete()
        .eq('news_id', newsId);

    if (error) throw new NotFoundException(error.message);
    return { success: true };
  }
}
