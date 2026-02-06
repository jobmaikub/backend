import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class SkillsService {
  constructor(
    private readonly supabaseService: SupabaseService,
  ) { }

  async createSkill(data: {
    name: string;
    category: {
      faculty_id: number;
      major_id: number;
    };
    icon?: string;
  }) {
    // 1. หา id ว่างที่น้อยที่สุด
    const { data: rpcData, error: idError } =
      await this.supabaseService.client.rpc('get_next_skill_id');

    if (idError) throw new BadRequestException(idError.message);

    const nextSkillId =
      Array.isArray(rpcData)
        ? rpcData[0]?.next_id
        : rpcData?.next_id;

    if (!nextSkillId) {
      throw new BadRequestException('Cannot generate skill_id');
    }

    // 2. insert โดยกำหนด skill_id เอง
    const { data: result, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('skills')
        .insert({
          skill_id: nextSkillId,
          ...data,
        })
        .select()
        .single();

    if (error) throw new BadRequestException(error.message);
    return result;
  }

  async getSkills() {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('skills')
        .select('*')
        .order('skill_id', { ascending: true });

    if (error) throw new NotFoundException(error.message);
    return data;
  }

  async getSkillById(skillId: number) {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('skills')
        .select('*')
        .eq('skill_id', skillId)
        .single();

    if (error || !data) {
      throw new NotFoundException('Skill not found');
    }

    return data;
  }

  async updateSkill(
    skillId: number,
    data: {
      name?: string;
      category?: {
        faculty_id: number;
        major_id: number;
      };
      icon?: string;
    },
  ) {
    const { data: result, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('skills')
        .update(data)
        .eq('skill_id', skillId)
        .select()
        .single();

    if (error || !result) {
      throw new NotFoundException(
        error?.message || 'Skill not found',
      );
    }

    return result;
  }

  async deleteSkill(skillId: number) {
    const { error } =
      await this.supabaseService.client
        .schema('admin')
        .from('skills')
        .delete()
        .eq('skill_id', skillId);

    if (error) throw new NotFoundException(error.message);
    return { success: true };
  }
}
