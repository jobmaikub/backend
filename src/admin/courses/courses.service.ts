import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

type CoursePayload = {
  title?: string;
  description?: string;
  career_path?: string;
  level?: string;
  duration?: number;
  external_url?: string;
  course_order?: number;
  skills_taught?: string[];
  learning_outcome?: string;
};

@Injectable()
export class CoursesService {
  constructor(
    private readonly supabaseService: SupabaseService,
  ) { }

  private normalizeEnum(value?: string) {
    if (!value) return undefined;

    return value
      .trim()
      .replace(/\s+/g, '')        // UX Designer → UXDesigner
      .replace(/_/g, '')          // กันพลาด
  }


  private normalizeLevel(value?: string) {
    if (!value) return undefined;
    return value.toLowerCase().trim();
  }


  async createCourse(data: CoursePayload) {
    const payload: CoursePayload = {
      ...data,
      career_path: this.normalizeEnum(data.career_path),
      level: this.normalizeLevel(data.level),
      skills_taught: Array.isArray(data.skills_taught)
        ? data.skills_taught
        : [],
    };

    const { data: result, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('courses')
        .insert(payload)
        .select()
        .single();

    if (error) throw new BadRequestException(error.message);
    return result;
  }

  async getCourses() {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('courses')
        .select(`
          course_id,
          title,
          description,
          career_path,
          level,
          duration,
          external_url,
          course_order,
          skills_taught,
          learning_outcome
        `)
        .order('course_order', { ascending: true });

    if (error) throw new NotFoundException(error.message);
    return data;
  }

  async getCourseById(courseId: number) {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('courses')
        .select('*')
        .eq('course_id', courseId)
        .single();

    if (error || !data) {
      throw new NotFoundException('Course not found');
    }

    return data;
  }

  async updateCourse(courseId: number, data: CoursePayload) {
    console.log('RAW DATA:', data);

    const payload = {
      career_path: this.normalizeEnum(data.career_path),
      level: this.normalizeLevel(data.level),
      duration: data.duration,
      external_url: data.external_url,
      course_order: data.course_order,
      skills_taught: data.skills_taught,
      learning_outcome: data.learning_outcome,
    };

    console.log('FINAL PAYLOAD:', payload);

    Object.keys(payload).forEach(
      (key) => payload[key] === undefined && delete payload[key]
    );

    const { data: result, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('courses')
        .update(payload)
        .eq('course_id', courseId)
        .select()
        .single();

    if (error) throw new BadRequestException(error.message);
    return result;
  }

  async deleteCourse(courseId: number) {
    const { error } =
      await this.supabaseService.client
        .schema('admin')
        .from('courses')
        .delete()
        .eq('course_id', courseId);

    if (error) throw new NotFoundException(error.message);
    return { success: true };
  }
}
