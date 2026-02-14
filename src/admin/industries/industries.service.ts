import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class IndustriesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getIndustries() {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('industries')
        .select('*')
        .order('industry_id');

    if (error) throw error;

    return data;
  }
}
