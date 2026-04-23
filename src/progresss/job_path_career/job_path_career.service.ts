import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class JobPathCareerService {
    constructor(
        private readonly supabaseService: SupabaseService,
    ) { }

    async getLearningPath(userId: number, careerId: number) {
        const { data, error } =
            await this.supabaseService.client
                .schema('admin')
                .from('user_learning_path')
                .select(`
          career_title,
          course_title,
          duration,
          industry,
          progress
        `)
                .eq('user_id', userId)
                .eq('career_id', careerId);

        if (error) throw new BadRequestException(error.message);
        if (!data || data.length === 0)
            throw new NotFoundException('Learning path not found');

        return data;
    }

    async getAllCourse(userId: number) {
        const { data, error } =
            await this.supabaseService.client
                .schema('admin')
                .from('user_progress_course')
                .select(`
          complete,
          admin:course_id (
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
            const course = item.admin?.[0];
            if (!course) return null;

            return {
                title: course.title,
                description: course.description,
                duration: course.duration,
                level: course.level,
                complete: item.complete,
            };
        }).filter(Boolean);
    }

    async deleteLearningPath(userId: number, careerId: number) {

        // 1️⃣ หา user_progress_career_id ก่อน
        const { data: careerProgress } =
            await this.supabaseService.client
                .schema('admin')
                .from('user_progress_career')
                .select('user_progress_career_id')
                .eq('user_id', userId)
                .eq('career_id', careerId)
                .single();

        if (!careerProgress)
            throw new NotFoundException('Learning path not found');

        const careerProgressId = careerProgress.user_progress_career_id;

        // 2️⃣ หา course ทั้งหมดใน career นี้
        const { data: courses } =
            await this.supabaseService.client
                .schema('admin')
                .from('user_progress_course')
                .select('user_progress_course_id')
                .eq('user_progress_career_id', careerProgressId);

        if (courses?.length) {
            const courseIds = courses.map(c => c.user_progress_course_id);

            // 3️⃣ ลบ lessons ก่อน
            await this.supabaseService.client
                .schema('admin')
                .from('user_progress_lesson')
                .delete()
                .in('user_progress_course_id', courseIds);

            // 4️⃣ ลบ courses
            await this.supabaseService.client
                .schema('admin')
                .from('user_progress_course')
                .delete()
                .eq('user_progress_career_id', careerProgressId);
        }

        // 5️⃣ ลบ career
        await this.supabaseService.client
            .schema('admin')
            .from('user_progress_career')
            .delete()
            .eq('user_progress_career_id', careerProgressId)
            .select();
        return { success: true };
    }
}
