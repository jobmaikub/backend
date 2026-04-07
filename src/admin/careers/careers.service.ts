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
  major_id?: number;
  min_salary?: number;
  max_salary?: number;
  growth_rate?: number;
  image_url?: string;
  required_skills?: string[];
  responsibilities?: string[];
  duration?: number;
}

interface UpdateCareerData {
  title?: string;
  description?: string;
  industry_id?: number;
  major_id?: number;
  min_salary?: number;
  max_salary?: number;
  growth_rate?: number;
  image_url?: string;
  required_skills?: string[];
  responsibilities?: string[];
  duration?: number;
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

  /* ================= CAREER SKILLS ================= */
  async getCareerSkills(careerId: number) {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('career_skills')
        .select(`
          skill_id,
          skills(skill_id, skill_name, category)
        `)
        .eq('career_id', careerId);

    if (error) {
      throw new NotFoundException(error.message);
    }

    return data || [];
  }

  async addCareerSkill(careerId: number, skillId: number) {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('career_skills')
        .insert({ career_id: careerId, skill_id: skillId })
        .select()
        .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async removeCareerSkill(careerId: number, skillId: number) {
    const { error } =
      await this.supabaseService.client
        .schema('admin')
        .from('career_skills')
        .delete()
        .eq('career_id', careerId)
        .eq('skill_id', skillId);

    if (error) {
      throw new NotFoundException(error.message);
    }

    return { success: true };
  }

  /* ================= CAREER INTERESTS ================= */
  async getCareerInterests(careerId: number) {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('career_interests')
        .select(`
          interest_id,
          interests(interest_id, interest_name)
        `)
        .eq('career_id', careerId);

    if (error) {
      throw new NotFoundException(error.message);
    }

    return data || [];
  }

  async addCareerInterest(careerId: number, interestId: number) {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('career_interests')
        .insert({ career_id: careerId, interest_id: interestId })
        .select()
        .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return data;
  }

  async removeCareerInterest(careerId: number, interestId: number) {
    const { error } =
      await this.supabaseService.client
        .schema('admin')
        .from('career_interests')
        .delete()
        .eq('career_id', careerId)
        .eq('interest_id', interestId);

    if (error) {
      throw new NotFoundException(error.message);
    }

    return { success: true };
  }

  /* ================= HELPER ================= */
  private mapCareer(row: any) {
    return {
      ...row,
      industries: row.industries || null,
    };
  }
}
