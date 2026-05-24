import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class IndustriesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getIndustries() {
    const { data, error } = await this.supabaseService.client
      .schema('admin')
      .from('industries')
      .select('*')
      .order('industry_id');

    if (error) throw new NotFoundException(error.message);
    return data;
  }

  async getIndustryById(industryId: number) {
    const { data, error } = await this.supabaseService.client
      .schema('admin')
      .from('industries')
      .select('*')
      .eq('industry_id', industryId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Industry not found');
    }

    return data;
  }
}
