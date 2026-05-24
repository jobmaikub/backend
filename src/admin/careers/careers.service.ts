import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

interface CreateCareerData {
  career_id?: number;
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
  private careersCache: any[] | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly supabaseService: SupabaseService) {}

  private invalidateCache() {
    this.careersCache = null;
    this.lastFetch = 0;
  }

  /* ================= CREATE ================= */
  async createCareer(data: CreateCareerData) {
    const { data: lastRows, error: lastRowsError } =
      await this.supabaseService.client
        .schema('admin')
        .from('careers')
        .select('career_id')
        .order('career_id', { ascending: false })
        .limit(1);

    if (lastRowsError) {
      throw new BadRequestException(lastRowsError.message);
    }

    const nextCareerId =
      Array.isArray(lastRows) && lastRows.length > 0
        ? Number(lastRows[0].career_id) + 1
        : 1;

    const payload: CreateCareerData = {
      ...data,
      career_id: nextCareerId,
      min_salary: data.min_salary ?? 0,
      max_salary: data.max_salary ?? 0,
      growth_rate: data.growth_rate ?? 1,
      image_url: data.image_url ?? '',
      required_skills: data.required_skills ?? [],
      responsibilities: data.responsibilities ?? [],
      duration: data.duration ?? 0,
    };

    const { data: result, error } = await this.supabaseService.client
      .schema('admin')
      .from('careers')
      .insert(payload)
      .select(
        `
        *,
        industries(name)
      `,
      )
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    this.invalidateCache();
    return this.mapCareer(result);
  }

  /* ================= GET ALL ================= */
  async getCareers() {
    const now = Date.now();
    if (this.careersCache && now - this.lastFetch < this.CACHE_TTL) {
      return this.careersCache;
    }

    const { data, error } = await this.supabaseService.client
      .schema('admin')
      .from('careers')
      .select(
        `
          *,
          industries(name)
        `,
      )
      .order('career_id', { ascending: true });

    if (error) {
      throw new NotFoundException(error.message);
    }

    const mappedData = data.map(this.mapCareer);
    this.careersCache = mappedData;
    this.lastFetch = now;

    return mappedData;
  }

  /* ================= GET BY ID ================= */
  async getCareerById(careerId: number) {
    const { data, error } = await this.supabaseService.client
      .schema('admin')
      .from('careers')
      .select(
        `
          *,
          industries(name)
        `,
      )
      .eq('career_id', careerId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Career not found');
    }

    return this.mapCareer(data);
  }

  /* ================= FILTER BY INDUSTRY ================= */
  async getCareersByIndustry(industryId: number) {
    const { data, error } = await this.supabaseService.client
      .schema('admin')
      .from('careers')
      .select(
        `
        *,
        industries(name)
      `,
      )
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

    const { data: result, error } = await this.supabaseService.client
      .schema('admin')
      .from('careers')
      .update(payload)
      .eq('career_id', careerId)
      .select(
        `
        *,
        industries(name)
      `,
      )
      .single();

    if (error || !result) {
      throw new NotFoundException(error?.message || 'Career not found');
    }

    this.invalidateCache();
    return this.mapCareer(result);
  }

  /* ================= DELETE ================= */
  async deleteCareer(careerId: number) {
    const { error: deleteSkillLinksError } = await this.supabaseService.client
      .schema('admin')
      .from('career_skills')
      .delete()
      .eq('career_id', careerId);

    if (deleteSkillLinksError) {
      throw new BadRequestException(deleteSkillLinksError.message);
    }

    const { error: deleteInterestLinksError } =
      await this.supabaseService.client
        .schema('admin')
        .from('career_interests')
        .delete()
        .eq('career_id', careerId);

    if (deleteInterestLinksError) {
      throw new BadRequestException(deleteInterestLinksError.message);
    }

    const { data: linkedCourses, error: linkedCoursesError } =
      await this.supabaseService.client
        .schema('admin')
        .from('courses')
        .select('course_id')
        .eq('career_id', careerId)
        .limit(1);

    if (linkedCoursesError) {
      throw new BadRequestException(linkedCoursesError.message);
    }

    if (Array.isArray(linkedCourses) && linkedCourses.length > 0) {
      throw new BadRequestException(
        'Cannot delete career with linked courses. Please delete related courses first.',
      );
    }

    const { error } = await this.supabaseService.client
      .schema('admin')
      .from('careers')
      .delete()
      .eq('career_id', careerId);

    if (error) {
      throw new BadRequestException(error.message);
    }

    this.invalidateCache();
    return { success: true };
  }

  /* ================= CAREER SKILLS ================= */
  async getCareerSkills(careerId: number) {
    const { data, error } = await this.supabaseService.client
      .schema('admin')
      .from('career_skills')
      .select(
        `
          skill_id,
          skills(skill_id, name, category)
        `,
      )
      .eq('career_id', careerId);

    if (error) {
      throw new NotFoundException(error.message);
    }

    return data || [];
  }

  async addCareerSkill(careerId: number, skillId: number) {
    const { data, error } = await this.supabaseService.client
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
    const { error } = await this.supabaseService.client
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
    const { data, error } = await this.supabaseService.client
      .schema('admin')
      .from('career_interests')
      .select(
        `
          interest_id,
          interests(interest_id, interest_name)
        `,
      )
      .eq('career_id', careerId);

    if (error) {
      throw new NotFoundException(error.message);
    }

    return data || [];
  }

  async addCareerInterest(careerId: number, interestId: number) {
    const { data, error } = await this.supabaseService.client
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
    const { error } = await this.supabaseService.client
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
