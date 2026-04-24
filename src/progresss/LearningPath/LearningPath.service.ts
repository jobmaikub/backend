import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class LearningPathService {
    constructor(private readonly supabaseService: SupabaseService) { }

    async getLearningPaths(userId: string) {
        const { data, error } = await this.supabaseService.client
            .from('v_learning_paths_user')
            .select('*')
            .eq('user_id', userId);

        if (error) throw new BadRequestException(error.message);

        return data.map((path) => ({
            id: path.career_id,
            title: path.title,
            image: path.image_url,
            growth: mapGrowth(path.growth_rate),
            courses: path.total_courses,
            hours: path.total_hours,
            progress: path.progress,
        }));
    }
}

function mapGrowth(rate: number): string {
    if (rate >= 20) return 'High Growth';
    if (rate >= 10) return 'Medium Growth';
    return 'Low Growth';
}