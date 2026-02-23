import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class JobPathAllCareerService {
    constructor(
        private readonly supabaseService: SupabaseService,
    ) { }

    async getAllLearningPath(userId: number) {
        const { data, error } = await this.supabaseService.client
            .schema('admin')
            .from('user_learning_path')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            throw new NotFoundException(error.message);
        }

        console.log(JSON.stringify(data, null, 2)); // ดู structure จริงก่อน

        return data;
    }

    async testConnection() {
        const { data, error } = await this.supabaseService.client
            .schema('progress')
            .from('user_progress_career')
            .select('*')
            .limit(1);

        console.log('ERROR:', error);
        console.log('DATA:', data);

        return { data, error };
    }

}
