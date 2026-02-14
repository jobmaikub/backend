import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

interface CreateCareerData {
  title: string;
  description: string;
  industry_id: number;
  min_salary?: number;
  max_salary?: number;
  growth_rate?: number;
  image_url?: string;
  required_skills?: string[];
  responsibilities?: string[];
  interest: string;
}

interface UpdateCareerData {
  title?: string;
  description?: string;
  industry_id?: number;
  min_salary?: number;
  max_salary?: number;
  growth_rate?: number;
  image_url?: string;
  required_skills?: string[];
  responsibilities?: string[];
  interest?: string;
}

@Injectable()
export class CareersService {
  constructor(
    private readonly supabaseService: SupabaseService,
  ) { }

  /* ================= CREATE ================= */
  async createCareer(data: CreateCareerData) {

    const { data: result, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('careers')
        .insert(data)
        .select(`
        *,
        industries(name)
      `)
        .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return this.mapCareer(result);
  }

  /* ================= GET ALL ================= */
  async getCareers() {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('careers')
        .select(`
          *,
          industries(name)
        `)
        .order('career_id', { ascending: true });

    if (error) {
      throw new NotFoundException(error.message);
    }

    return data.map(this.mapCareer);
  }

  /* ================= GET BY ID ================= */
  async getCareerById(careerId: number) {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('careers')
        .select(`
          *,
          industries(name)
        `)
        .eq('career_id', careerId)
        .single();

    if (error || !data) {
      throw new NotFoundException('Career not found');
    }

    return this.mapCareer(data);
  }

  /* ================= FILTER BY INDUSTRY ================= */
  async getCareersByIndustry(industryId: number) {

    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('careers')
        .select(`
        *,
        industries(name)
      `)
        .eq('industry_id', industryId);

    if (error) {
      throw new NotFoundException(error.message);
    }

    return data.map(this.mapCareer);
  }

  /* ================= UPDATE ================= */
  async updateCareer(careerId: number, data: UpdateCareerData) {

    const payload: any = {
      ...data,
      ...(data.interest && {
        interest: data.interest.trim(),
      }),
    };

    const { data: result, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('careers')
        .update(payload)
        .eq('career_id', careerId)
        .select(`
        *,
        industries(name)
      `)
        .single();

    if (error || !result) {
      throw new NotFoundException(
        error?.message || 'Career not found',
      );
    }

    return this.mapCareer(result);
  }

  /* ================= DELETE ================= */
  async deleteCareer(careerId: number) {
    const { error } =
      await this.supabaseService.client
        .schema('admin')
        .from('careers')
        .delete()
        .eq('career_id', careerId);

    if (error) {
      throw new NotFoundException(error.message);
    }

    return { success: true };
  }

  /* ================= HELPER ================= */
  private mapCareer(row: any) {
    return {
      ...row,
      industry: row.industries?.name || null,
      industries: undefined,
    };
  }
}
