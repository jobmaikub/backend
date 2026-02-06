import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class InterestsService {
  constructor(
    private readonly supabaseService: SupabaseService,
  ) {}

  async createInterest(data: { interest_name: string }) {
    const { data: result, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('interests')
        .insert(data)
        .select()
        .single();

    if (error) throw new BadRequestException(error.message);
    return result;
  }

  async getInterests() {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('interests')
        .select('*')
        .order('interest_id', { ascending: true });

    if (error) throw new NotFoundException(error.message);
    return data;
  }

  async getInterestById(interestId: number) {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('interests')
        .select('*')
        .eq('interest_id', interestId)
        .single();

    if (error || !data) {
      throw new NotFoundException('Interest not found');
    }

    return data;
  }

  async updateInterest(
    interestId: number,
    data: { interest_name?: string },
  ) {
    const { data: result, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('interests')
        .update(data)
        .eq('interest_id', interestId)
        .select()
        .single();

    if (error || !result) {
      throw new NotFoundException(
        error?.message || 'Interest not found',
      );
    }

    return result;
  }

  async deleteInterest(interestId: number) {
    const { error } =
      await this.supabaseService.client
        .schema('admin')
        .from('interests')
        .delete()
        .eq('interest_id', interestId);

    if (error) throw new NotFoundException(error.message);
    return { success: true };
  }
}
