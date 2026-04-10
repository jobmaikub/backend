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
    industry_id?: number;
    image_url: string;
    source_url: string;
    source_name: string;
    date?: string;
  }) {
    const payload = {
      title: data.title,
      description: data.description.trim(),
      industry_id: data.industry_id,
      image_url: data.image_url,
      source_url: data.source_url,
      source_name: data.source_name,
      date: data.date,
    };

    const { data: result, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('news')
        .insert(payload)
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
        .select(`
          *,
          industries(name)
        `)
        .order('news_id', { ascending: false });

    if (error) throw new NotFoundException(error.message);
    return data;
  }

  async getNewsById(newsId: number) {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('news')
        .select('*')
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
      date?: string;
    },
  ) {
    const payload: {
      title?: string;
      description?: string;
      industry_id?: number;
      image_url?: string;
      source_url?: string;
      source_name?: string;
      date?: string;
    } = {
      title: data.title,
      industry_id: data.industry_id,
      image_url: data.image_url,
      source_url: data.source_url,
      source_name: data.source_name,
      date: data.date,
    };

    if (data.description !== undefined) {
      payload.description = data.description.trim();
    }

    const { data: result, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('news')
        .update(payload)
        .eq('news_id', newsId)
        .select()
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
