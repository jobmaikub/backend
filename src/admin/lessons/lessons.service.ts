import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class LessonsService {
  constructor(
    private readonly supabaseService: SupabaseService,
  ) {}

  async createLesson(data: {
    title: string;
    course_id: number;
    lesson_order: number;
    duration?: number;
    external_url?: string;
  }) {
    const { data: result, error } =
      await this.supabaseService.client
        .schema('admin')  
        .from('lessons')
        .insert(data)
        .select()
        .single();

    if (error) throw new BadRequestException(error.message);
    return result;
  }

  async getLessons() {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')  
        .from('lessons')
        .select(`
          lesson_id,
          title,
          lesson_order,
          duration,
          external_url,
          course_id,
          courses (
            course_id,
            title
          )
        `)
        .order('lesson_order', { ascending: true });

    if (error) throw new NotFoundException(error.message);
    return data;
  }

  async getLessonById(lessonId: number) {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')  
        .from('lessons')
        .select(`
          lesson_id,
          title,
          lesson_order,
          duration,
          external_url,
          course_id,
          courses (
            course_id,
            title
          )
        `)
        .eq('lesson_id', lessonId)
        .single();

    if (error || !data) {
      throw new NotFoundException('Lesson not found');
    }

    return data;
  }

  async getLessonsByCourse(courseId: number) {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')  
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('lesson_order', { ascending: true });

    if (error) throw new NotFoundException(error.message);
    return data;
  }

  async updateLesson(
    lessonId: number,
    data: {
      title?: string;
      course_id?: number;
      lesson_order?: number;
      duration?: number;
      external_url?: string;
    },
  ) {
    const { data: result, error } =
      await this.supabaseService.client
        .schema('admin')  
        .from('lessons')
        .update(data)
        .eq('lesson_id', lessonId)
        .select()
        .single();

    if (error || !result) {
      throw new NotFoundException(
        error?.message || 'Lesson not found',
      );
    }

    return result;
  }

  async deleteLesson(lessonId: number) {
    const { error } =
      await this.supabaseService.client
        .schema('admin')  
        .from('lessons')
        .delete()
        .eq('lesson_id', lessonId);

    if (error) throw new NotFoundException(error.message);
    return { success: true };
  }
}
