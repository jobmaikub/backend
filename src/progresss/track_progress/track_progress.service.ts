
import {
    Injectable,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class TrackProgressService {
    constructor(
        private readonly supabaseService: SupabaseService,
    ) { }

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
            const normalized = this.normalizeDate(typeof value === 'string' ? value : null);
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
        if (error) { console.error('fetchLessons error:', error.message); }
        return data ?? [];
    }

    private async fetchCourseProgress(userId: string | number) {
        const { data, error } = await this.supabaseService.client
            .from('user_progress_course')
            .select('*')
            .eq('user_id', userId);
        if (error) { console.error('fetchCourseProgress error:', error.message); }
        return data ?? [];
    }

    // ─── Public API ────────────────────────────────────────────────────────────

    async getStats(authUserId: string, progressUserId?: string | number) {
        const resolvedId = progressUserId ?? authUserId;

        // รันทุก query พร้อมกัน — ไม่มี admin fallback แล้ว
        const [profileRes, lessons, courseProgress, careerProgress] = await Promise.all([
            this.supabaseService.client
                .from('profiles')
                .select('courses_completed, lessons_done, total_learning_hours, current_streak')
                .eq('id', authUserId)
                .single(),
            this.fetchLessons(resolvedId),
            this.fetchCourseProgress(resolvedId),
            this.supabaseService.client
                .from('user_progress_career')
                .select('progress')
                .eq('user_id', resolvedId),
        ]);

        const profile = profileRes.data;

        // lessons count
        const lessonsDone = lessons.length;

        // courses complete
        const completedCoursesCount = courseProgress.filter((c: any) =>
            c?.complete === true || (typeof c?.progress === 'number' && c.progress >= 100)
        ).length;

        // overall progress
        let overallProgress = 0;
        if (!careerProgress.error && careerProgress.data?.length) {
            const total = careerProgress.data.reduce((s, c) => s + (c.progress || 0), 0);
            overallProgress = Math.round(total / careerProgress.data.length);
        } else if (courseProgress.length) {
            const total = courseProgress.reduce((s: number, r: any) => {
                if (typeof r.progress === 'number') return s + r.progress;
                if (r.complete === true) return s + 100;
                return s;
            }, 0);
            overallProgress = Math.round(total / courseProgress.length);
        }

        // activity heatmap (built from lessons + courses already fetched)
        const activity = this.buildHeatmap(lessons, courseProgress);
        const streak = this.calculateStreak(activity);

        return {
            coursesComplete: profile?.courses_completed ?? completedCoursesCount,
            totalLessons: profile?.lessons_done ?? lessonsDone,
            totalHours: profile?.total_learning_hours ?? 0,
            streak: profile?.current_streak ?? streak,
            overallProgress,
        };
    }

    async getActivityHeatmap(userId: string | number) {
        const [lessons, courses] = await Promise.all([
            this.fetchLessons(userId),
            this.fetchCourseProgress(userId),
        ]);
        return this.buildHeatmap(lessons, courses.filter((c: any) => c?.complete === true));
    }

    private buildHeatmap(lessons: any[], completedCourses: any[]) {
        const map: Record<string, { lessons: number; courses: Set<number>; count: number }> = {};

        lessons.forEach((item: any) => {
            const date = this.extractActivityDate(item);
            if (!date) return;
            if (!map[date]) map[date] = { lessons: 0, courses: new Set(), count: 0 };
            map[date].count += 1;
            map[date].lessons += 1;
        });

        completedCourses.forEach((item: any) => {
            const date = this.extractActivityDate(item);
            if (!date) return;
            if (!map[date]) map[date] = { lessons: 0, courses: new Set(), count: 0 };
            const id = item.user_progress_course_id ?? item.course_id;
            if (id) map[date].courses.add(id);
        });

        return Object.entries(map)
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .map(([date, val]) => ({
                date,
                count: val.count,
                lessons: val.lessons,
                courses: val.courses.size,
            }));
    }

    private calculateStreak(activity: { date: string }[]) {
        if (!activity.length) return 0;
        const daySet = new Set(activity.map((a) => a.date));
        let streak = 0;
        const cursor = new Date();
        while (true) {
            const key = cursor.toISOString().split('T')[0];
            if (!daySet.has(key)) break;
            streak += 1;
            cursor.setDate(cursor.getDate() - 1);
        }
        return streak;
    }

    async getActivity(userId: string | number) {
        const { data, error } = await this.supabaseService.client
            .from('user_progress_lesson')
            .select('done_at, created_at, updated_at')
            .eq('user_id', userId);
        if (error) return [];
        const map: Record<string, number> = {};
        data.forEach((item: any) => {
            const date = this.extractActivityDate(item);
            if (!date) return;
            map[date] = (map[date] || 0) + 1;
        });
        return Object.entries(map).map(([date, count]) => ({ date, count }));
    }

    async getCompletedCourses(userId: string | number) {
        const { data, error } = await this.supabaseService.client
            .from('user_progress_course')
            .select(`
                user_progress_course_id,
                progress,
                complete,
                course_id,
                courses!inner (
                    course_id,
                    title,
                    description
                )
            `)
            .eq('user_id', userId);

        if (error) return [];

        return data.map((c) => {
            const course = Array.isArray((c as any).courses) ? (c as any).courses[0] : (c as any).courses;
            return {
                course,
                id: c.user_progress_course_id,
                progress: c.progress,
                courseId: c.course_id,
                complete: c.complete,
                title: course?.title,
                description: course?.description,
            };
        });
    }

    async getOverallProgress(userId: string | number) {
        const [careerRes, courseRes] = await Promise.all([
            this.supabaseService.client.from('user_progress_career').select('progress').eq('user_id', userId),
            this.supabaseService.client.from('user_progress_course').select('progress, complete').eq('user_id', userId),
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
}