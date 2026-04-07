import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

type CoursePayload = {
  title?: string;
  description?: string;
  level?: string;
  duration?: number;
  external_url?: string;
  course_order?: number;
  skills_taught?: string[];
  learning_outcome?: string[];
  career_id?: number;
};

@Injectable()
export class CoursesService {
  constructor(
    private readonly supabaseService: SupabaseService,
  ) { }

  private normalizeLevel(value?: string) {
    if (!value) return undefined;
    return value.toLowerCase().trim();
  }

  async createCourse(data: CoursePayload) {
    const payload: CoursePayload = {
      ...data,
      level: this.normalizeLevel(data.level),
      skills_taught: Array.isArray(data.skills_taught) ? data.skills_taught : [],
      learning_outcome: Array.isArray(data.learning_outcome) ? data.learning_outcome : [],
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
          level,
          duration_mins,
          external_url,
          course_order,
          image_url,
          skills_taught,
          learning_outcome,
          career_id,
          careers (
            career_id,
            title
          )
        `)
        .order('course_order', { ascending: true });

    if (error) throw new NotFoundException(error.message);
    // Rename image_url to course_image for frontend compatibility
    return data?.map((course: any) => {
      const careerTitle = Array.isArray(course.careers)
        ? course.careers[0]?.title
        : course.careers?.title;
      
      return {
        ...course,
        course_image: course.image_url,
        career_name: careerTitle || `Career #${course.career_id}`
      };
    });
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

    // Rename image_url to course_image for frontend compatibility
    return {
      ...data,
      course_image: data.image_url
    };
  }

  async updateCourse(courseId: number, data: CoursePayload) {
    console.log('RAW DATA:', data);

    const payload = {
      title: data.title,
      description: data.description,
      career_id: data.career_id,
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
