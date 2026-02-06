import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

interface CreateCareerData {
  title: string;
  description: string;
  industry: string;
  min_salary?: number;
  max_salary?: number;
  growth_rate?: number;
  image_url?: string;
  required_skills?: string[];
  responsibilities?: string[];
  interest: string; // ⭐ บังคับ
}

interface UpdateCareerData {
  title?: string;
  description?: string;
  industry?: string;
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
  ) {}

  async createCareer(data: CreateCareerData) {
    if (!data.interest || !data.interest.trim()) {
      throw new BadRequestException('interest is required');
    }

    const { data: result, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('careers')
        .insert({
          ...data,
          interest: data.interest.trim(),
        })
        .select()
        .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return result;
  }

  async getCareers() {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('careers')
        .select(`
          career_id,
          title,
          description,
          industry,
          min_salary,
          max_salary,
          growth_rate,
          image_url,
          required_skills,
          responsibilities,
          interest
        `)
        .order('career_id', { ascending: true });

    if (error) {
      throw new NotFoundException(error.message);
    }

    return data;
  }

  async getCareerById(careerId: number) {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('careers')
        .select(`
          career_id,
          title,
          description,
          industry,
          min_salary,
          max_salary,
          growth_rate,
          image_url,
          required_skills,
          responsibilities,
          interest
        `)
        .eq('career_id', careerId)
        .single();

    if (error || !data) {
      throw new NotFoundException('Career not found');
    }

    return data;
  }

  async getCareersByIndustry(industry: string) {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('careers')
        .select(`
          career_id,
          title,
          description,
          industry,
          min_salary,
          max_salary,
          growth_rate,
          image_url,
          required_skills,
          responsibilities,
          interest
        `)
        .eq('industry', industry)
        .order('career_id', { ascending: true });

    if (error) {
      throw new NotFoundException(error.message);
    }

    return data;
  }

  async updateCareer(
    careerId: number,
    data: UpdateCareerData,
  ) {
    const payload = {
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
        .select()
        .single();

    if (error || !result) {
      throw new NotFoundException(
        error?.message || 'Career not found',
      );
    }

    return result;
  }

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
}
