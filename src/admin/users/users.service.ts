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

  async createUser(data: {
    name: string;
    email: string;
    role: any;
    join_date?: string;
  }) {
    const { data: result, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('users')
        .insert(data)
        .select()
        .single();

    if (error) throw new BadRequestException(error.message);
    return result;
  }

  async getUsers() {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('users')
        .select(`
        user_id,
        name,
        email,
        role,
        status,
        join_date,

        ban_users (
          ban_id,
          ban_date,
          unban_date,
          reason
        ),

        user_reports!user_reports_report_user_id_fkey (
          report_id,
          by_user_id,
          last_update,
          reason
        )
      `)
        .order('user_id', { ascending: true });

    if (error) throw new NotFoundException(error.message);

    // 🔥 map shape ให้ตรง frontend
    return data.map((u) => ({
      id: u.user_id,
      name: u.name,
      email: u.email,
      role: u.role,
      joinedDate: u.join_date,

      banHistory: (u.ban_users ?? []).map((b) => ({
        banId: b.ban_id,
        banDate: b.ban_date,
        unbanDate: b.unban_date ?? "-",
        reason: b.reason,
      })),

      reports: (u.user_reports ?? []).map((r) => ({
        reportId: r.report_id,
        offenderId: r.by_user_id,
        lastUpdate: r.last_update,
        reason: r.reason,
      })),
    }));
  }

  async getUserById(userId: number) {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('users')
        .select(`
        user_id,
        name,
        email,
        role,
        status,
        join_date,

        ban_users (
          ban_id,
          ban_date,
          unban_date,
          reason
        ),

        user_reports!user_reports_report_user_id_fkey (
          report_id,
          by_user_id,
          last_update,
          reason
        )
      `)
        .eq('user_id', userId)
        .single();

    if (error || !data) {
      throw new NotFoundException('User not found');
    }

    return {
      id: data.user_id,
      name: data.name,
      email: data.email,
      role: data.role,
      joinedDate: data.join_date,
      banHistory: (data.ban_users ?? []).map((b) => ({
        banId: b.ban_id,
        banDate: b.ban_date,
        unbanDate: b.unban_date ?? "-",
        reason: b.reason,
      })),
      reports: (data.user_reports ?? []).map((r) => ({
        reportId: r.report_id,
        offenderId: r.by_user_id,
        lastUpdate: r.last_update,
        reason: r.reason,
      })),
    };
  }

  async updateUser(
    userId: number,
    data: {
      name?: string;
      email?: string;
      role?: any;
      join_date?: string;
    },
  ) {
    const { data: result, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('users')
        .update(data)
        .eq('user_id', userId)
        .select()
        .single();

    if (error || !result) {
      throw new NotFoundException(
        error?.message || 'User not found',
      );
    }

    return result;
  }

  async updateUserStatus(userId: number, status: 'ban' | 'unban') {
    if (status === 'ban') {
      await this.supabaseService.client
        .schema('admin')
        .from('ban_users')
        .insert({
          user_id: userId,
          reason: 'Admin Action',
        });
    }

    if (status === 'unban') {
      await this.supabaseService.client
        .schema('admin')
        .from('ban_users')
        .update({
          unban_date: new Date().toISOString().split('T')[0],
        })
        .eq('user_id', userId)
        .is('unban_date', null);
    }

    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('users')
        .update({ status })
        .eq('user_id', userId)
        .select()
        .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async deleteUser(userId: number) {
    const { error } =
      await this.supabaseService.client
        .schema('admin')
        .from('users')
        .delete()
        .eq('user_id', userId);

    if (error) throw new NotFoundException(error.message);
    return { success: true };
  }
}
