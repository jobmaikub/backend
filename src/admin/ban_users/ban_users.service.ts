import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class BanUsersService {
  constructor(
    private readonly supabaseService: SupabaseService,
  ) { }

  async banUser(data: {
    user_id: number;
    reason: string;
    unban_date?: string;
  }) {
    const { data: activeBan } =
      await this.supabaseService.client
        .schema('admin')
        .from('ban_users')
        .select('*')
        .eq('user_id', data.user_id)
        .is('unban_date', null)
        .single();

    if (activeBan) {
      throw new BadRequestException('User is already banned');
    }

    const { data: result, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('ban_users')
        .insert({
          user_id: data.user_id,
          reason: data.reason,
          unban_date: data.unban_date ?? null,
        })
        .select()
        .single();

    if (error) throw new BadRequestException(error.message);

    await this.supabaseService.client
      .schema('admin')
      .from('users')
      .update({ status: 'ban' })
      .eq('user_id', data.user_id);

    return result;
  }

  async getBans() {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('ban_users')
        .select('*')
        .order('ban_date', { ascending: false });

    if (error) throw new NotFoundException(error.message);
    return data;
  }

  async getBanById(banId: number) {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('ban_users')
        .select('*')
        .eq('ban_id', banId)
        .single();

    if (error || !data) {
      throw new NotFoundException('Ban record not found');
    }

    return data;
  }

  async getBansByUserId(userId: number) {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('ban_users')
        .select('*')
        .eq('user_id', userId)
        .order('ban_date', { ascending: false });

    if (error) throw new NotFoundException(error.message);
    if (!data || data.length === 0) {
      throw new NotFoundException('No ban records found for this user');
    }

    return data;
  }

  async getActiveBanByUserId(userId: number) {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('ban_users')
        .select('*')
        .eq('user_id', userId)
        .is('unban_date', null)
        .maybeSingle();

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data) {
      throw new NotFoundException('User is not currently banned');
    }

    return data;
  }

  async unbanUserByUserId(userId: number) {
    const today = new Date().toISOString().slice(0, 10);

    const { data: activeBan, error: findError } =
      await this.supabaseService.client
        .schema('admin')
        .from('ban_users')
        .select('*')
        .eq('user_id', userId)
        .is('unban_date', null)
        .maybeSingle();

    if (findError) {
      throw new BadRequestException(findError.message);
    }

    if (!activeBan) {
      throw new NotFoundException('User is not currently banned');
    }

    const { data: ban, error: updateError } =
      await this.supabaseService.client
        .schema('admin')
        .from('ban_users')
        .update({ unban_date: today })
        .eq('ban_id', activeBan.ban_id)
        .select()
        .single();

    if (updateError || !ban) {
      throw new NotFoundException('Ban record not found');
    }

    await this.supabaseService.client
      .schema('admin')
      .from('users')
      .update({ status: 'unban' })
      .eq('user_id', userId);

    return ban;
  }

  async deleteBan(banId: number) {
    const { error } =
      await this.supabaseService.client
        .schema('admin')
        .from('ban_users')
        .delete()
        .eq('ban_id', banId);

    if (error) throw new NotFoundException(error.message);
    return { success: true };
  }
}
