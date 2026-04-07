import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly supabaseService: SupabaseService,
  ) { }

  // Get all users from public.profiles (end-users)
  async getUsers() {
    const { data, error } =
      await this.supabaseService.client
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          joined_at,
          is_banned
        `)
        .order('joined_at', { ascending: false });

    if (error) throw new NotFoundException(error.message);

    return data?.map((u) => ({
      id: u.id,
      name: u.full_name,
      email: u.email,
      role: u.role,
      joinedDate: u.joined_at,
      isBanned: u.is_banned,
    })) || [];
  }

  // Get user by ID with ban history and reports
  async getUserById(userId: string) {
    const { data: profile, error: profileError } =
      await this.supabaseService.client
        .from('profiles')
        .select('id, email, full_name, role, joined_at, is_banned')
        .eq('id', userId)
        .single();

    if (profileError || !profile) {
      throw new NotFoundException('User not found');
    }

    // Get ban history
    const { data: bans } = await this.supabaseService.client
      .from('ban_users')
      .select('ban_id, ban_date, unban_date, reason')
      .eq('user_id', userId)
      .order('ban_date', { ascending: false });

    // Get reports about this user
    const { data: reports } = await this.supabaseService.client
      .from('user_reports')
      .select(`
        report_id,
        by_user_id,
        reason,
        report_type,
        status,
        created_at
      `)
      .eq('report_user_id', userId)
      .order('created_at', { ascending: false });

    return {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: profile.role,
      joinedDate: profile.joined_at,
      isBanned: profile.is_banned,
      banHistory: (bans ?? []).map((b) => ({
        banId: b.ban_id,
        banDate: b.ban_date,
        unbanDate: b.unban_date ?? null,
        reason: b.reason,
      })),
      reports: (reports ?? []).map((r) => ({
        reportId: r.report_id,
        reporterId: r.by_user_id,
        reason: r.reason,
        type: r.report_type,
        status: r.status,
        createdAt: r.created_at,
      })),
    };
  }

  // Get ban history for a user
  async getUserBans(userId: string) {
    const { data, error } =
      await this.supabaseService.client
        .from('ban_users')
        .select('*')
        .eq('user_id', userId)
        .order('ban_date', { ascending: false });

    if (error) throw new NotFoundException(error.message);
    return data || [];
  }

  // Get active ban for user
  async getActiveBan(userId: string) {
    const { data, error } =
      await this.supabaseService.client
        .from('ban_users')
        .select('*')
        .eq('user_id', userId)
        .is('unban_date', null)
        .single();

    if (error && error.code !== 'PGRST116') {
      throw new NotFoundException(error.message);
    }

    return data || null;
  }

  // Ban user
  async banUser(userId: string, reason: string) {
    // Check if already banned
    const activeBan = await this.getActiveBan(userId);
    if (activeBan) {
      throw new BadRequestException('User is already banned');
    }

    // Insert ban record
    const { data: ban, error: banError } =
      await this.supabaseService.client
        .from('ban_users')
        .insert({
          user_id: userId,
          reason,
        })
        .select()
        .single();

    if (banError) throw new BadRequestException(banError.message);

    // Update is_banned flag
    await this.supabaseService.client
      .from('profiles')
      .update({ is_banned: true })
      .eq('id', userId);

    return ban;
  }

  // Unban user
  async unbanUser(userId: string) {
    // Find active ban
    const activeBan = await this.getActiveBan(userId);
    if (!activeBan) {
      throw new BadRequestException('User is not currently banned');
    }

    // Update ban record
    const { data: ban, error: banError } =
      await this.supabaseService.client
        .from('ban_users')
        .update({
          unban_date: new Date().toISOString(),
        })
        .eq('ban_id', activeBan.ban_id)
        .select()
        .single();

    if (banError) throw new BadRequestException(banError.message);

    // Update is_banned flag
    await this.supabaseService.client
      .from('profiles')
      .update({ is_banned: false })
      .eq('id', userId);

    return ban;
  }

  // Get reports against a user
  async getUserReports(userId: string) {
    const { data, error } =
      await this.supabaseService.client
        .from('user_reports')
        .select(`
          report_id,
          by_user_id,
          reason,
          report_type,
          status,
          created_at,
          reporter:by_user_id(id, email, full_name)
        `)
        .eq('report_user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw new NotFoundException(error.message);
    return data || [];
  }
}
