
import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class TrackProgressService {
    constructor(
        private readonly supabaseService: SupabaseService,
    ) { }

    async getStats(userId: string) {
        const { data, error } =
            await this.supabaseService.client
                .from('profiles')
                .select(`
        courses_completed,
        lessons_done,
        total_learning_hours,
        current_streak
      `)
                .eq('id', userId)
                .single();

        if (error || !data) {
            throw new NotFoundException('User stats not found');
        }

        // 🔥 ดึง progress
        const overallProgress = await this.getOverallProgress(userId);

        return {
            coursesComplete: data.courses_completed ?? 0,
            totalLessons: data.lessons_done ?? 0,
            totalHours: data.total_learning_hours ?? 0,
            streak: data.current_streak ?? 0,
            overallProgress, // ✅ เพิ่ม
        };
    }

    async getActivity(userId: string) {
        const { data, error } =
            await this.supabaseService.client
                .from('lesson_progress') // 👈 table คุณ
                .select('done_at')
                .eq('user_id', userId);

        if (error) throw new Error(error.message);

        // 🔥 group by date
        const map: Record<string, number> = {};

        data.forEach((item) => {
            const date = item.done_at.split("T")[0];
            map[date] = (map[date] || 0) + 1;
        });

        return Object.entries(map).map(([date, count]) => ({
            date,
            count,
        }));
    }

    async getCompletedCourses(userId: string) {
        const { data, error } =
            await this.supabaseService.client
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

        if (error) {
            throw new NotFoundException(error.message);
        }

        // 🔥 map ให้ frontend ใช้ง่าย
        return data.map((c) => ({
            id: c.user_progress_course_id,
            progress: c.progress,
            courseId: c.course_id,
            title: c.courses?.[0]?.title,
            description: c.courses?.[0]?.description,
        }));
    }

    async getActivityHeatmap(userId: string) {
        const { data, error } =
            await this.supabaseService.client
                .from('user_progress_lesson')
                .select('done_at')
                .eq('user_id', userId)
                .eq('done', true)
                .not('done_at', 'is', null);

        if (error) {
            throw new NotFoundException(error.message);
        }

        const map: Record<string, number> = {};

        data.forEach((item) => {
            // ✅ normalize date (กัน timezone เพี้ยน)
            const date = new Date(item.done_at)
                .toISOString()
                .split('T')[0];

            map[date] = (map[date] || 0) + 1;
        });

        return Object.entries(map).map(([date, count]) => ({
            date,
            count,
        }));
    }

    async getOverallProgress(userId: string) {
        const { data, error } =
            await this.supabaseService.client
                .from('user_progress_career')
                .select(`progress`)
                .eq('user_id', userId);

        if (error) {
            throw new NotFoundException(error.message);
        }

        if (!data.length) return 0;

        // 🔥 เอา average progress
        const total = data.reduce((sum, c) => sum + (c.progress || 0), 0);
        return Math.round(total / data.length);
    }

}