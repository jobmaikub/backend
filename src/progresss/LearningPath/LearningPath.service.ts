import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class LearningPathService {
    constructor(
        private readonly supabaseService: SupabaseService,
    ) { }

    // 🔹 GET ALL PATHS (with user progress)
    async getAllPaths(userId: string) {
        const { data, error } =
            await this.supabaseService.client
                .from('careers')
                .select(`
        career_id,
        title,
        industry,
        growth_rate,
        image_url,
        courses(count),
        user_progress_career!left (
          progress,
          user_id
        )
      `)
                .or(`user_progress_career.user_id.eq.${userId},user_progress_career.user_id.is.null`);

        if (error) {
            console.log('SUPABASE ERROR:', error);
            throw new BadRequestException(error.message);
        }

        return (data || []).map((item: any) => ({
            career_id: item.career_id,
            title: item.title,
            industry: item.industry,
            growth_rate: item.growth_rate,
            image_url: item.image_url,
            total_courses: item.courses?.[0]?.count ?? 0,
            progress:
                item.user_progress_career?.find((p: any) => p.user_id === userId)?.progress ?? 0,
        }));
    }
    // 🔹 GET PATH DETAIL
    async getPathDetail(careerId: number, userId: string) {
        const { data, error } =
            await this.supabaseService.client
                .from('careers') // ⚠️ ให้ตรงกับอันบน
                .select(`
        career_id,
        title,
        industry,
        growth_rate,
        image_url,
        courses (
          course_id,
          title,
          description,
          duration,
          level,
          lessons (
            lesson_id,
            title,
            lesson_order,
            duration
          )
        ),
        progress:user_progress_career!left (
          progress,
          user_id
        )
      `)
                .eq('career_id', careerId)
                .or(`progress.user_id.eq.${userId},progress.user_id.is.null`)
                .maybeSingle();

        if (error) {
            console.log(error);
            throw new BadRequestException(error.message);
        }

        if (!data) {
            throw new NotFoundException('Learning path not found');
        }

        return {
            ...data,
            progress:
                data.progress?.find((p: any) => p.user_id === userId)?.progress ?? 0,
        };
    }
}