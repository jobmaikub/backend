import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class HomeService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private mapCareer(row: any) {
    return {
      ...row,
      industry: row.industry_name || row.industries?.name || null,
      industries: undefined,
      industry_name: undefined,
    };
  }

  async getTrendingCareers(limit = 3) {
    const { data, error } = await this.supabaseService.client
      .schema('admin')
      .from('career_popularity')
      .select(`*`)
      .order('popularity', { ascending: false })
      .order('career_id', { ascending: true })
      .limit(limit);

    if (error) throw new NotFoundException(error.message);
    return (data || []).map(this.mapCareer);
  }

  async getAllCareers(limit = 100, offset = 0) {
    const { data, error } = await this.supabaseService.client
      .schema('admin')
      .from('careers')
      .select(`*, industries(name)`)
      .order('career_id', { ascending: true })
      .range(offset, offset + limit - 1);

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

  async getIndustryNews(limit = 10, industry?: string) {
    // console.log(`[HomeService] Fetching news (limit: ${limit}, industry: ${industry || 'all'})...`);

    try {
      // Build query for admin schema
      let query = this.supabaseService.client
        .schema('admin')
        .from('news')
        .select('*, industries!inner(name)')
        .order('news_id', { ascending: false })
        .limit(limit);

      if (industry) {
        // Filter by industry name (case-insensitive)
        query = query.ilike('industries.name', `%${industry}%`);
      }

      const { data: adminData, error: adminError } = await query;

      if (!adminError && adminData && adminData.length > 0) {
        return adminData.map((item) => ({
          ...item,
          industry: item.industries?.name || 'All Industries',
        }));
      }

      // Fallback to public schema if admin is empty or errors
      let publicQuery = this.supabaseService.client
        .from('news')
        .select('*, industries!inner(name)')
        .order('news_id', { ascending: false })
        .limit(limit);

      if (industry) {
        publicQuery = publicQuery.ilike('industries.name', `%${industry}%`);
      }

      const { data: publicData, error: publicError } = await publicQuery;

      if (publicError) {
        // If filtering failed, maybe try without filter as a last resort
        console.warn(
          '[HomeService] Filtered fetch failed, trying without filter...',
        );
        const { data: allData } = await this.supabaseService.client
          .from('news')
          .select('*, industries(name)')
          .order('news_id', { ascending: false })
          .limit(limit);

        return (allData || []).map((item) => ({
          ...item,
          industry: item.industries?.name || 'All Industries',
        }));
      }

      return (publicData || []).map((item) => ({
        ...item,
        industry: item.industries?.name || 'All Industries',
      }));
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          '[HomeService] Critical error in getIndustryNews:',
          error.message,
        );
      } else {
        console.error('[HomeService] An unexpected error occurred:', error);
      }
      return [];
    }
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
