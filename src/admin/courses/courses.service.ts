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
  duration_mins?: number;
  course_order?: number;
  skills_taught?: string[];
  learning_outcome?: string[];
  career_id?: number;
  image_url?: string;
};

@Injectable()
export class CoursesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private normalizeLevel(value?: string) {
    if (!value) return undefined;
    return value.toLowerCase().trim();
  }

  async createCourse(data: CoursePayload) {
    const payload = {
      title: data.title,
      description: data.description,
      career_id: data.career_id,
      career_path: data.career_path,
      level: this.normalizeLevel(data.level),
      duration_mins: data.duration_mins ?? 0,
      course_order: data.course_order,
      image_url: data.image_url,
      skills_taught: Array.isArray(data.skills_taught)
        ? data.skills_taught
        : [],
      learning_outcome: Array.isArray(data.learning_outcome)
        ? data.learning_outcome
        : [],
    };

    Object.keys(payload).forEach(
      (key) =>
        (payload as any)[key] === undefined && delete (payload as any)[key],
    );

    const { data: result, error } = await this.supabaseService.client
      .schema('admin')
      .from('courses')
      .insert(payload)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return result;
  }

  async getCourses() {
    const { data, error } = await this.supabaseService.client
      .schema('admin')
      .from('courses')
      .select(
        `
          course_id,
          title,
          description,
          career_path,
          level,
          duration_mins,
          course_order,
          image_url,
          skills_taught,
          learning_outcome,
          career_id,
          careers (
            career_id,
            title
          )
        `,
      )
      .order('course_order', { ascending: true });

    if (error) throw new NotFoundException(error.message);
    return data?.map((course: any) => {
      const careerTitle = Array.isArray(course.careers)
        ? course.careers[0]?.title
        : course.careers?.title;

      return {
        ...course,
        career_path: course.career_path,
        career_name: careerTitle || `Career #${course.career_id}`,
      };
    });
  }

  async getCourseById(courseId: number) {
    const { data, error } = await this.supabaseService.client
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
    const payload = {
      title: data.title,
      description: data.description,
      career_id: data.career_id,
      career_path: data.career_path,
      level: this.normalizeLevel(data.level),
      duration_mins: data.duration_mins,
      course_order: data.course_order,
      image_url: data.image_url,
      skills_taught: data.skills_taught,
      learning_outcome: data.learning_outcome,
    };

    Object.keys(payload).forEach(
      (key) => payload[key] === undefined && delete payload[key],
    );

    const { data: result, error } = await this.supabaseService.client
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
    const { error } = await this.supabaseService.client
      .schema('admin')
      .from('courses')
      .delete()
      .eq('course_id', courseId);

    if (error) throw new NotFoundException(error.message);
    return { success: true };
  }
}
