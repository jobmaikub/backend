import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class BanUsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async banUser(data: {
    user_id: string;
    reason: string;
    unban_date?: string;
    created_by?: string;
  }) {
    const nowIso = new Date().toISOString();

    const { data: activeBans, error: activeBanError } =
      await this.supabaseService.client
        .from('ban_users')
        .select('*')
        .eq('user_id', data.user_id)
        .or(`unban_date.is.null,unban_date.gt.${nowIso}`)
        .order('ban_date', { ascending: false })
        .limit(1);

    if (activeBanError) {
      throw new BadRequestException(activeBanError.message);
    }

    const activeBan = activeBans?.[0] ?? null;

    if (activeBan) {
      throw new BadRequestException('User is already banned');
    }

    const { data: result, error } = await this.supabaseService.client
      .from('ban_users')
      .insert({
        user_id: data.user_id,
        reason: data.reason,
        unban_date: data.unban_date ?? null,
        created_by: data.created_by ?? null,
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // Update public.profiles.is_banned = true
    const { error: profileUpdateError } = await this.supabaseService.client
      .from('profiles')
      .update({ is_banned: true })
      .eq('id', data.user_id);

    if (profileUpdateError) {
      throw new BadRequestException(profileUpdateError.message);
    }

    return result;
  }

  async getBans() {
    const { data, error } = await this.supabaseService.client
      .from('ban_users')
      .select('*')
      .order('ban_date', { ascending: false });

    if (error) throw new NotFoundException(error.message);
    return data;
  }

  async getBanById(banId: string) {
    const { data, error } = await this.supabaseService.client
      .from('ban_users')
      .select('*')
      .eq('ban_id', banId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Ban record not found');
    }

    return data;
  }

  async getBansByUserId(userId: string) {
    const { data, error } = await this.supabaseService.client
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

  async getActiveBanByUserId(userId: string) {
    const nowIso = new Date().toISOString();

    const { data, error } = await this.supabaseService.client
      .from('ban_users')
      .select('*')
      .eq('user_id', userId)
      .or(`unban_date.is.null,unban_date.gt.${nowIso}`)
      .order('ban_date', { ascending: false })
      .limit(1);

    if (error) {
      throw new BadRequestException(error.message);
    }

    const activeBan = data?.[0] ?? null;

    if (!activeBan) {
      throw new NotFoundException('User is not currently banned');
    }

    return activeBan;
  }

  async unbanUserByUserId(userId: string) {
    const unbanAt = new Date().toISOString();

    const { data: updatedBans, error: updateError } =
      await this.supabaseService.client
        .from('ban_users')
        .update({ unban_date: unbanAt })
        .eq('user_id', userId)
        .or(`unban_date.is.null,unban_date.gt.${unbanAt}`)
        .select('*');

    if (updateError) {
      throw new BadRequestException(updateError.message);
    }

    // Update public.profiles.is_banned = false
    const { error: profileUpdateError } = await this.supabaseService.client
      .from('profiles')
      .update({ is_banned: false })
      .eq('id', userId);

    if (profileUpdateError) {
      throw new BadRequestException(profileUpdateError.message);
    }

    if (!updatedBans || updatedBans.length === 0) {
      return {
        message: 'No active ban row found. Profile unbanned successfully.',
      };
    }

    return {
      message: 'User unbanned successfully',
      updated_count: updatedBans.length,
      latest_ban: updatedBans[0],
    };
  }

  async deleteBan(banId: string) {
    const { data: ban, error: findError } = await this.supabaseService.client
      .from('ban_users')
      .select('ban_id, user_id, unban_date')
      .eq('ban_id', banId)
      .maybeSingle();

    if (findError) throw new NotFoundException(findError.message);
    if (!ban) throw new NotFoundException('Ban record not found');

    const { error } = await this.supabaseService.client
      .from('ban_users')
      .delete()
      .eq('ban_id', banId);

    if (error) throw new NotFoundException(error.message);

    const deletedBanWasActive =
      ban.unban_date === null || new Date(ban.unban_date) > new Date();

    if (deletedBanWasActive) {
      const { error: profileUpdateError } = await this.supabaseService.client
        .from('profiles')
        .update({ is_banned: false })
        .eq('id', ban.user_id);

      if (profileUpdateError) {
        throw new BadRequestException(profileUpdateError.message);
      }
    }

    return { success: true };
  }
}
