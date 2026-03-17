import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class HomeService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private mapCareer(row: any) {
    return {
      ...row,
      industry: row.industries?.name || null,
      industries: undefined,
    };
  }

  async getTrendingCareers(limit = 3) {
    const { data, error } = await this.supabaseService.client
      .schema('admin')
      .from('careers')
      .select(`*, industries(name)`)
      .order('career_id', { ascending: true })
      .limit(limit);

    if (error) throw new NotFoundException(error.message);
    return (data || []).map(this.mapCareer);
  }

  async getAllCareers() {
    const { data, error } = await this.supabaseService.client
      .schema('admin')
      .from('careers')
      .select(`*, industries(name)`)
      .order('career_id', { ascending: true });

    if (error) throw new NotFoundException(error.message);
    return (data || []).map(this.mapCareer);
  }

  async getCareerById(id: number) {
    const { data, error } = await this.supabaseService.client
      .schema('admin')
      .from('careers')
      .select(`*, industries(name)`)
      .eq('career_id', id)
      .single();

    if (error || !data) throw new NotFoundException('Career not found');
    return this.mapCareer(data);
  }

  async getIndustryNews(limit = 10) {
    const { data, error } = await this.supabaseService.client
      .schema('admin')
      .from('news')
      .select('*')
      .order('news_id', { ascending: false })
      .limit(limit);

    if (error) throw new NotFoundException(error.message);
    return data || [];
  }

  async getIndustries() {
    const { data, error } = await this.supabaseService.client
      .schema('admin')
      .from('industries')
      .select('*')
      .order('industry_id', { ascending: true });

    if (error) throw new NotFoundException(error.message);
    return data || [];
  }

  async getHomeData() {
    const [trendingCareers, industryNews, industries] = await Promise.all([
      this.getTrendingCareers(3),
      this.getIndustryNews(8),
      this.getIndustries(),
    ]);

    return { trendingCareers, industryNews, industries };
  }
}
