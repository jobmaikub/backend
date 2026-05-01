
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
            const normalized = this.normalizeDate(
                typeof value === 'string' ? value : null,
            );
            if (normalized) return normalized;
        }

        return null;
    }

    private async getProgressLessons(userId: string | number) {
        const adminRes = await this.supabaseService.client
            .schema('admin')
            .from('user_progress_lesson')
            .select('*')
            .eq('user_id', userId)
            .eq('done', true);

        if (!adminRes.error && Array.isArray(adminRes.data) && adminRes.data.length > 0) {
            return adminRes.data;
        }

        const publicRes = await this.supabaseService.client
            .from('user_progress_lesson')
            .select('*')
            .eq('user_id', userId)
            .eq('done', true);

        if (publicRes.error) return [];

        return publicRes.data ?? [];
    }

    private async getProgressCoursesForActivity(userId: string | number) {
        const adminRes = await this.supabaseService.client
            .schema('admin')
            .from('user_progress_course')
            .select('*')
            .eq('user_id', userId);

        if (!adminRes.error && Array.isArray(adminRes.data) && adminRes.data.length > 0) {
            return adminRes.data;
        }

        const publicRes = await this.supabaseService.client
            .from('user_progress_course')
            .select('*')
            .eq('user_id', userId);

        if (publicRes.error) return [];
        return publicRes.data ?? [];
    }

    async getStats(authUserId: string, progressUserId?: string | number) {
        const { data, error } =
            await this.supabaseService.client
                .from('profiles')
                .select(`
        courses_completed,
        lessons_done,
        total_learning_hours,
        current_streak
      `)
                .eq('id', authUserId)
                .single();

        // 🔥 ดึง progress
        const resolvedProgressUserId = progressUserId ?? authUserId;
        const overallProgress = await this.getOverallProgress(resolvedProgressUserId);

        const lessons = await this.getProgressLessons(resolvedProgressUserId);
        const lessonsDone = lessons.length;

        const completedCourses = await this.getCompletedCourses(resolvedProgressUserId);
        const completedCoursesCount = completedCourses.filter((c: any) => {
            if (c?.complete === true) return true;
            return typeof c?.progress === 'number' && c.progress >= 100;
        }).length;

        const activity = await this.getActivityHeatmap(resolvedProgressUserId);
        const streak = this.calculateStreak(activity);

        return {
            coursesComplete: data?.courses_completed ?? completedCoursesCount,
            totalLessons: data?.lessons_done ?? lessonsDone,
            totalHours: data?.total_learning_hours ?? 0,
            streak: data?.current_streak ?? streak,
            overallProgress, // ✅ เพิ่ม
        };
    }

    private calculateStreak(activity: { date: string; count: number }[]) {
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
        const { data, error } =
            await this.supabaseService.client
                .from('user_progress_lesson')
                .select('*')
                .eq('user_id', userId);

        if (error) return [];

        // 🔥 group by date
        const map: Record<string, number> = {};

        data.forEach((item: any) => {
            const date = this.extractActivityDate(item);
            if (!date) return;
            map[date] = (map[date] || 0) + 1;
        });

        return Object.entries(map).map(([date, count]) => ({
            date,
            count,
        }));
    }

    async getCompletedCourses(userId: string | number) {
        const adminResult = await this.supabaseService.client
            .schema('admin')
            .from('user_progress_course')
            .select(`
                user_progress_course_id,
                progress,
                complete,
                course_id,
                courses!user_progress_course_course_fk (
                    course_id,
                    title,
                    description
                )
            `)
            .eq('user_id', userId);

        const { data, error } =
            !adminResult.error && Array.isArray(adminResult.data) && adminResult.data.length > 0
                ? adminResult
                : await this.supabaseService.client
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

        if (error) {
            return [];
        }

        // 🔥 map ให้ frontend ใช้ง่าย
        return data.map((c) => ({
            course: Array.isArray((c as any).courses)
                ? (c as any).courses[0]
                : (c as any).courses,
            id: c.user_progress_course_id,
            progress: c.progress,
            courseId: c.course_id,
            complete: c.complete,
            title: Array.isArray((c as any).courses)
                ? (c as any).courses[0]?.title
                : (c as any).courses?.title,
            description: Array.isArray((c as any).courses)
                ? (c as any).courses[0]?.description
                : (c as any).courses?.description,
        }));
    }

    async getActivityHeatmap(userId: string | number) {
        const lessonData = await this.getProgressLessons(userId);
        const courseData = await this.getProgressCoursesForActivity(userId);

        const map: Record<string, number> = {};

        lessonData.forEach((item: any) => {
            const date = this.extractActivityDate(item);
            if (!date) return;
            map[date] = (map[date] || 0) + 1;
        });

        // Fallback: ถ้า lesson ไม่มี timestamp ให้ใช้ course progress เพื่อให้ heatmap ไม่ว่าง
        if (Object.keys(map).length === 0) {
            courseData.forEach((item: any) => {
                const isActive =
                    item?.complete === true
                    || (typeof item?.progress === 'number' && item.progress > 0);

                if (!isActive) return;

                const date = this.extractActivityDate(item);
                if (!date) return;

                map[date] = (map[date] || 0) + 1;
            });
        }

        return Object.entries(map)
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .map(([date, count]) => ({
            date,
            count,
        }));
    }

    async getOverallProgress(userId: string | number) {
        const adminResult = await this.supabaseService.client
            .schema('admin')
            .from('user_progress_career')
            .select('progress')
            .eq('user_id', userId);

        const { data, error } =
            !adminResult.error && Array.isArray(adminResult.data) && adminResult.data.length > 0
                ? adminResult
                : await this.supabaseService.client
                    .from('user_progress_career')
                    .select('progress')
                    .eq('user_id', userId);

        if (!error && data.length > 0) {
            const total = data.reduce((sum, c) => sum + (c.progress || 0), 0);
            return Math.round(total / data.length);
        }

        // fallback: คำนวณจากความคืบหน้ารายคอร์ส เมื่อ career progress ไม่มีข้อมูล
        const adminCourses = await this.supabaseService.client
            .schema('admin')
            .from('user_progress_course')
            .select('progress, complete')
            .eq('user_id', userId);

        const courseResult =
            !adminCourses.error && Array.isArray(adminCourses.data) && adminCourses.data.length > 0
                ? adminCourses
                : await this.supabaseService.client
                    .from('user_progress_course')
                    .select('progress, complete')
                    .eq('user_id', userId);

        if (courseResult.error || !courseResult.data?.length) {
            return 0;
        }

        const total = courseResult.data.reduce((sum, row: any) => {
            if (typeof row.progress === 'number') {
                return sum + row.progress;
            }
            if (row.complete === true) {
                return sum + 100;
            }
            return sum;
        }, 0);

        return Math.round(total / courseResult.data.length);
    }

}