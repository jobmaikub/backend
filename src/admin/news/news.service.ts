import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class NewsService {
  // 1. Add the Logger for the cron job
  private readonly logger = new Logger(NewsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  private newsCache: any[] | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  private invalidateCache() {
    this.newsCache = null;
    this.lastFetch = 0;
  }

  // ==========================================
  // EXISTING CRUD METHODS
  // ==========================================

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

    const { data: result, error } = await this.supabaseService.client
      .schema('admin')
      .from('news')
      .insert(payload)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    this.invalidateCache();
    return result;
  }

  async getNews() {
    const now = Date.now();
    if (this.newsCache && now - this.lastFetch < this.CACHE_TTL) {
      return this.newsCache;
    }

    const { data, error } = await this.supabaseService.client
      .schema('admin')
      .from('news')
      .select(
        `
          *,
          industries(name)
        `,
      )
      .order('news_id', { ascending: true });

    if (error) throw new NotFoundException(error.message);

    this.newsCache = data;
    this.lastFetch = now;
    return data;
  }

  async searchNews(query: string, industry?: string) {
    if (!query || query.trim() === '') {
      return this.getNews();
    }

    // Get all news with industry info, then filter in memory
    // This is simpler than trying to do complex OR queries in Supabase
    const { data, error } = await this.supabaseService.client
      .schema('admin')
      .from('news')
      .select('*, industry:industry_id(name)')
      .order('news_id', { ascending: true });

    if (error) throw new NotFoundException(error.message);

    // Filter in memory
    const searchLower = query.toLowerCase();
    let filtered = data.filter(
      (article: any) =>
        (article.title?.toLowerCase() || '').includes(searchLower) ||
        (article.source_name?.toLowerCase() || '').includes(searchLower) ||
        (article.description?.toLowerCase() || '').includes(searchLower) ||
        (article.industry?.name?.toLowerCase() || '').includes(searchLower),
    );

    // Optional: filter by industry
    if (industry && industry !== 'All Industries') {
      filtered = filtered.filter(
        (article: any) => article.industry?.name === industry,
      );
    }

    return filtered;
  }

  async getNewsById(newsId: number) {
    const { data, error } = await this.supabaseService.client
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

    const { data: result, error } = await this.supabaseService.client
      .schema('admin')
      .from('news')
      .update(payload)
      .eq('news_id', newsId)
      .select('*, industry:industry_id(name)')
      .single();

    if (error || !result) {
      throw new NotFoundException(error?.message || 'News not found');
    }

    this.invalidateCache();
    return result;
  }

  async deleteNews(newsId: number) {
    const { error } = await this.supabaseService.client
      .schema('admin')
      .from('news')
      .delete()
      .eq('news_id', newsId);

    if (error) throw new NotFoundException(error.message);
    this.invalidateCache();
    return { success: true };
  }

  // ==========================================
  // CRON JOB AUTOMATION
  // ==========================================

  // Runs automatically every day at 8:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  // @Cron(CronExpression.EVERY_MINUTE)
  async fetchAndSaveAllNews() {
    this.logger.log(
      'Starting daily news fetch for all JobMaikub industries...',
    );
    const apiKey = process.env.GNEWS_API_KEY;

    // Broadened all search queries using Boolean logic (AND / OR) to catch more relevant results
    const industries = [
      {
        id: 1,
        name: 'Science',
        query: 'science AND (career OR jobs OR hiring OR industry)',
      },
      {
        id: 2,
        name: 'Technology',
        query:
          '(technology OR tech OR software OR IT) AND (career OR jobs OR hiring OR industry)',
      },
      {
        id: 3,
        name: 'Marketing',
        query:
          '(marketing OR advertising OR SEO) AND (career OR jobs OR hiring OR trends)',
      },
      {
        id: 4,
        name: 'Health',
        query:
          '(healthcare OR medical OR nursing) AND (career OR jobs OR hiring OR professionals)',
      },
      {
        id: 5,
        name: 'Design & Creative',
        query:
          '(design OR creative OR art) AND (career OR jobs OR hiring OR industry)',
      },
      {
        id: 6,
        name: 'Finance',
        query:
          '(finance OR banking OR accounting) AND (career OR jobs OR hiring OR industry)',
      },
      {
        id: 7,
        name: 'Education',
        query:
          '(education OR teaching OR teachers) AND (career OR jobs OR hiring)',
      },
      {
        id: 8,
        name: 'Engineering',
        query: 'engineering AND (career OR jobs OR hiring OR industry)',
      },
    ];

    for (const industry of industries) {
      try {
        this.logger.log(`Fetching news for ${industry.name}...`);
        const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(industry.query)}&lang=en&max=5&apikey=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.articles || data.articles.length === 0) {
          continue;
        }

        const articlesToInsert = data.articles.map((article) => ({
          title: article.title,
          description: article.description,
          source_url: article.url,
          image_url: article.image,
          source_name: article.source.name,
          date: article.publishedAt,
          industry_id: industry.id,
        }));

        // Using your existing supabaseService here with the 'admin' schema
        const { error } = await this.supabaseService.client
          .schema('admin')
          .from('news')
          .upsert(articlesToInsert, { onConflict: 'source_url' });

        if (error) {
          this.logger.error(
            `Database error for ${industry.name}:`,
            error.message,
          );
        }
      } catch (error) {
        if (error instanceof Error) {
          this.logger.error(
            `Failed process for ${industry.name}:`,
            error.message,
          );
        } else {
          this.logger.error(
            `Failed process for ${industry.name}:`,
            'Unknown error occurred',
          );
        }
      }
    }
    this.invalidateCache();
    this.logger.log('Daily news fetch complete!');
  }
}
