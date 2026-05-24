import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class TrackProgressService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private normalizeDate(value?: string | null): string | null {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString().split('T')[0];
  }

  private extractActivityDate(item: any): string | null {
    if (!item || typeof item !== 'object') return null;
    const candidates = [
      item.done_at,
      item.completed_at,
      item.updated_at,
      item.created_at,
      item.done_date,
      item.activity_date,
      item.date,
    ];
    for (const value of candidates) {
      const normalized = this.normalizeDate(
        typeof value === 'string' ? value : null,
      );
      if (normalized) return normalized;
    }
    return null;
  }

  // ─── Single query helpers (no admin schema fallback — data is in public) ───

  private async fetchLessons(userId: string | number) {
    const { data, error } = await this.supabaseService.client
      .from('user_progress_lesson')
      .select('*')
      .eq('user_id', userId)
      .eq('done', true);
    if (error) {
      console.error('fetchLessons error:', error.message);
    }
    return data ?? [];
  }

  private async fetchCourseProgress(userId: string | number) {
    const { data, error } = await this.supabaseService.client
      .from('user_progress_course')
      .select('*')
      .eq('user_id', userId);
    if (error) {
      console.error('fetchCourseProgress error:', error.message);
    }
    return data ?? [];
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  async getStats(authUserId: string, progressUserId?: string | number) {
    const resolvedId = progressUserId ?? authUserId;

    const [profileRes, progressRes] = await Promise.all([
      this.supabaseService.client
        .from('profiles')
        .select(
          'courses_completed, lessons_done, total_learning_hours, current_streak',
        )
        .eq('id', authUserId)
        .single(),
      this.supabaseService.client
        .from('view_user_overall_progress')
        .select('overall_progress')
        .eq('user_id', resolvedId)
        .single(),
    ]);

    const profile = profileRes.data;
    const overallProgress = progressRes.data?.overall_progress ?? 0;

    return {
      coursesComplete: profile?.courses_completed ?? 0,
      totalLessons: profile?.lessons_done ?? 0,
      totalHours: profile?.total_learning_hours ?? 0,
      streak: profile?.current_streak ?? 0,
      overallProgress,
    };
  }

  async getActivityHeatmap(userId: string | number) {
    const { data, error } = await this.supabaseService.client
      .from('view_user_activity_summary')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    return error ? [] : data;
  }

  async getActivity(userId: string | number) {
    return this.getActivityHeatmap(userId);
  }

  async getCompletedCourses(userId: string | number) {
    const { data, error } = await this.supabaseService.client
      .from('view_user_completed_courses')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('getCompletedCourses error:', error.message);
      return [];
    }

    return data || [];
  }

  async getOverallProgress(userId: string | number) {
    const [careerRes, courseRes] = await Promise.all([
      this.supabaseService.client
        .from('user_progress_career')
        .select('progress')
        .eq('user_id', userId),
      this.supabaseService.client
        .from('user_progress_course')
        .select('progress, complete')
        .eq('user_id', userId),
    ]);

    if (!careerRes.error && careerRes.data?.length) {
      const total = careerRes.data.reduce((s, c) => s + (c.progress || 0), 0);
      return Math.round(total / careerRes.data.length);
    }

    if (!courseRes.error && courseRes.data?.length) {
      const total = courseRes.data.reduce((s: number, r: any) => {
        if (typeof r.progress === 'number') return s + r.progress;
        if (r.complete === true) return s + 100;
        return s;
      }, 0);
      return Math.round(total / courseRes.data.length);
    }

    return 0;
  }

  async getEnrichedSkills(userId: string | number) {
    const { data, error } = await this.supabaseService.client
      .from('view_user_enriched_skills')
      .select('*')
      .eq('user_id', userId)
      .order('level', { ascending: false })
      .order('lastUpdated', { ascending: false });

    if (error) {
      console.error('getEnrichedSkills error:', error.message);
      return [];
    }

    return data || [];
  }
}
