import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // ฟังก์ชันสำหรับ Admin ดึงรายชื่อผู้ใช้ทั้งหมด
  async findAll() {
    const { data, error } = await this.supabaseService.client
      .from('profiles')
      .select('id, email, full_name, role, joined_at, is_banned') // ดึงข้อมูลให้ครบตามหน้า UI
      .order('joined_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // ฟังก์ชันสำหรับแบนผู้ใช้ (Admin Only)
  async banUser(userId: string) {
    const { data, error } = await this.supabaseService.client
      .from('profiles')
      .update({ is_banned: true })
      .eq('id', userId);

    if (error) throw error;
    return { message: 'User has been banned' };
  }
}
