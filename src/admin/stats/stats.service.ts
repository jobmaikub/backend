import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class StatsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getDashboardStats() {
    const tables = [
      { name: 'profiles', schema: 'public', key: 'users' },
      { name: 'user_reports', schema: 'public', key: 'reports' },
      { name: 'faculties', schema: 'admin', key: 'faculties' },
      { name: 'majors', schema: 'admin', key: 'majors' },
      { name: 'skills', schema: 'admin', key: 'skills' },
      { name: 'interests', schema: 'admin', key: 'interests' },
      { name: 'careers', schema: 'admin', key: 'careers' },
      { name: 'courses', schema: 'admin', key: 'courses' },
      { name: 'lessons', schema: 'admin', key: 'lessons' },
      { name: 'news', schema: 'admin', key: 'news' },
    ];

    const stats: Record<string, number> = {};

    await Promise.all(
      tables.map(async (table) => {
        const { count, error } = await this.supabaseService.client
          .schema(table.schema)
          .from(table.name)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.error(
            `Error fetching count for ${table.name}:`,
            error.message,
          );
          stats[table.key] = 0;
        } else {
          stats[table.key] = count || 0;
        }
      }),
    );

    return stats;
  }
}
