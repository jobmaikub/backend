import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class JobPathLessonService {
    constructor(
        private readonly supabaseService: SupabaseService,
    ) { }

    async getCourse(userId: number) {
        const { data, error } =
            await this.supabaseService.client
                .from('admin.user_progress_course')
                .select(`
                    complete,
                    progress,
                    courses!user_progress_course_course_fk (
                        course_id,
                        title,
                        description,
                        duration,
                        level
                    )
                    `)
                .eq('user_id', userId);

        if (error) throw new BadRequestException(error.message);
        if (!data || data.length === 0)
            throw new NotFoundException('No courses found');

        return data.map((item) => {
            const course = Array.isArray(item.courses)
                ? item.courses[0]
                : item.courses;

            return {
                course_id: course?.course_id,
                title: course?.title,
                description: course?.description,
                duration: course?.duration,
                level: course?.level,
                complete: item.complete,
                progress: item.progress,
            };
        });
    }

    async getSkill(userId: number, courseId: number) {
        const { data: progressCheck } =
            await this.supabaseService.client
                .from('admin.user_progress_course')
                .select('user_progress_course_id')
                .eq('user_id', userId)
                .eq('course_id', courseId)
                .maybeSingle();

        if (!progressCheck)
            throw new NotFoundException('Course not found for user');

        const { data, error } =
            await this.supabaseService.client
                .from('admin.courses')
                .select('skills_taught')
                .eq('course_id', courseId)
                .single();

        if (error || !data)
            throw new NotFoundException('Course not found');

        return {
            course_id: courseId,
            skills_taught: data.skills_taught,
        };
    }

    async getAllLesson(userId: number) {
        const { data, error } =
            await this.supabaseService.client
                .from('admin.user_progress_lesson')
                .select(`
                lesson_id,
                done,
                lessons:lesson_id (
                    title,
                    lesson_order,
                    duration
                )
                `)
                .eq('user_id', userId)
                .order('lesson_id', { ascending: true });

        if (error) throw new BadRequestException(error.message);
        if (!data || data.length === 0)
            throw new NotFoundException('No lessons found');

        return data.map((item: any) => {
            const lesson = item.lessons;

            return {
                lesson_id: item.lesson_id,
                title: lesson?.title,
                lesson_order: lesson?.lesson_order,
                duration: lesson?.duration,
                done: item.done,
            };
        });
    }

    async lessonDone(userId: number, lessonId: number) {
        const { data, error } =
            await this.supabaseService.client
                .from('admin.user_progress_lesson')
                .update({ done: true })
                .eq('user_id', userId)
                .eq('lesson_id', lessonId)
                .select();

        if (error) {
            throw new BadRequestException(error.message);
        }

        if (!data || data.length === 0) {
            throw new NotFoundException('Lesson not found for user');
        }

        return { success: true };
    }

}
