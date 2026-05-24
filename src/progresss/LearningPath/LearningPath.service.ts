import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class LearningPathService {
  private readonly logger = new Logger(LearningPathService.name);
  constructor(private readonly supabaseService: SupabaseService) {}

  async getLearningPaths(userId: string) {
    // Fetch user progress for careers
    const { data: careerProgress, error } = await this.supabaseService.client
      .from('user_progress_career')
      .select('*')
      .eq('user_id', userId);

    if (error) throw new BadRequestException(error.message);

    // Fetch career details from admin schema
    const careerIds = careerProgress.map((cp) => cp.career_id);
    let careersData: any[] = [];
    if (careerIds.length > 0) {
      const { data } = await this.supabaseService.client
        .schema('admin')
        .from('careers')
        .select('*')
        .in('career_id', careerIds);
      if (data) careersData = data;
    }

    // Merge data
    return careerProgress.map((cp) => {
      const careerDetail =
        careersData.find((c) => c.career_id === cp.career_id) || {};
      return {
        id: cp.career_id,
        title: careerDetail.title || 'Unknown Career',
        image: careerDetail.image_url || null,
        growth: mapGrowth(careerDetail.growth_rate || 0),
        growth_rate: careerDetail.growth_rate || 0,
        industry: careerDetail.industry || 'General',
        progress: cp.progress || 0,
        // These will be overridden by frontend useCareers anyway, but let's provide defaults
        courses: careerDetail.course_count || 0,
        hours: careerDetail.duration_hrs || 0,
      };
    });
  }

  async startLearningPath(userId: string, careerId: number) {
    // Check if already started
    const { data: existing } = await this.supabaseService.client
      .from('user_progress_career')
      .select('*')
      .eq('user_id', userId)
      .eq('career_id', careerId)
      .single();

    if (existing) {
      return { message: 'Learning path already started', progress: existing };
    }

    // Insert new learning path. Triggers will handle courses and lessons automatically.
    const { data, error } = await this.supabaseService.client
      .from('user_progress_career')
      .insert([{ user_id: userId, career_id: careerId, progress: 0 }])
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return { message: 'Learning path started successfully', progress: data };
  }

  async getCareerCourses(userId: string, careerId: number) {
    // Find the user_progress_career
    const { data: careerProgress, error: careerError } =
      await this.supabaseService.client
        .from('user_progress_career')
        .select('user_progress_career_id, progress')
        .eq('user_id', userId)
        .eq('career_id', careerId)
        .single();

    if (careerError || !careerProgress) {
      throw new NotFoundException('Learning path not started for this career');
    }

    // Get courses progress
    const { data: coursesProgress, error } = await this.supabaseService.client
      .from('user_progress_course')
      .select('*')
      .eq('user_progress_career_id', careerProgress.user_progress_career_id);

    if (error) throw new BadRequestException(error.message);

    // Fetch course details from admin schema
    const courseIds = coursesProgress.map((cp) => cp.course_id);
    let coursesData: any[] = [];
    if (courseIds.length > 0) {
      const { data } = await this.supabaseService.client
        .schema('admin')
        .from('courses')
        .select('*')
        .in('course_id', courseIds);
      if (data) coursesData = data;
    }

    // Merge and sort
    const mergedCourses = coursesProgress.map((cp) => {
      const courseDetail = coursesData.find(
        (c) => c.course_id === cp.course_id,
      );
      return {
        user_progress_course_id: cp.user_progress_course_id,
        course_id: cp.course_id,
        complete: cp.complete,
        progress: cp.progress,
        course_details: courseDetail,
      };
    });

    const sortedCourses = mergedCourses.sort(
      (a, b) =>
        (a.course_details?.course_order || 0) -
        (b.course_details?.course_order || 0),
    );

    return {
      career_progress: careerProgress.progress,
      courses: sortedCourses,
    };
  }

  async getCourseLessons(userId: string, courseId: number) {
    // Find the user_progress_course
    const { data: courseProgress, error: courseError } =
      await this.supabaseService.client
        .from('user_progress_course')
        .select('user_progress_course_id, progress, complete')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

    if (courseError || !courseProgress) {
      throw new NotFoundException(
        'Course progress not found. Please start the career first.',
      );
    }

    // Get lessons progress
    const { data: lessonsProgress, error } = await this.supabaseService.client
      .from('user_progress_lesson')
      .select('*')
      .eq('user_progress_course_id', courseProgress.user_progress_course_id);

    if (error) throw new BadRequestException(error.message);

    // Fetch lesson details from admin schema
    const lessonIds = lessonsProgress.map((lp) => lp.lesson_id);
    let lessonsData: any[] = [];
    if (lessonIds.length > 0) {
      const { data } = await this.supabaseService.client
        .schema('admin')
        .from('lessons')
        .select('*')
        .in('lesson_id', lessonIds);
      if (data) lessonsData = data;
    }

    // Merge and sort
    const mergedLessons = lessonsProgress.map((lp) => {
      const lessonDetail = lessonsData.find(
        (l) => l.lesson_id === lp.lesson_id,
      );
      return {
        user_progress_lesson_id: lp.user_progress_lesson_id,
        lesson_id: lp.lesson_id,
        done: lp.done,
        done_at: lp.done_at,
        lesson_details: lessonDetail,
      };
    });

    const sortedLessons = mergedLessons.sort(
      (a, b) =>
        (a.lesson_details?.lesson_order || 0) -
        (b.lesson_details?.lesson_order || 0),
    );

    return {
      course_progress: courseProgress.progress,
      is_completed: courseProgress.complete,
      lessons: sortedLessons,
    };
  }

  async completeLesson(userId: string, lessonId: number, done: boolean) {
    // Find the user's lesson progress record to update
    const { data: lessonProgress, error: findError } =
      await this.supabaseService.client
        .from('user_progress_lesson')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .single();

    if (findError || !lessonProgress) {
      throw new NotFoundException('Lesson progress not found');
    }

    // Update to done
    const { data, error } = await this.supabaseService.client
      .from('user_progress_lesson')
      .update({ done: done })
      .eq('user_progress_lesson_id', lessonProgress.user_progress_lesson_id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    return {
      message: `Lesson marked as ${done ? 'completed' : 'incomplete'}`,
      progress: data,
    };
  }

  async completeCourse(userId: string, courseId: number, done: boolean) {
    // Find the user_progress_course first
    const { data: courseProgress, error: courseError } =
      await this.supabaseService.client
        .from('user_progress_course')
        .select('user_progress_course_id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

    if (courseError || !courseProgress) {
      throw new NotFoundException('Course progress not found');
    }

    // Update all lessons belonging to this user_progress_course
    const { data, error } = await this.supabaseService.client
      .from('user_progress_lesson')
      .update({ done: done })
      .eq('user_progress_course_id', courseProgress.user_progress_course_id)
      .select();

    if (error) throw new BadRequestException(error.message);

    return {
      message: `Course marked as ${done ? 'completed' : 'incomplete'}`,
      updatedLessons: data.length,
    };
  }

  async bulkUpdateLessons(
    userId: string,
    lessonUpdates: { lesson_id: number; done: boolean }[],
  ) {
    this.logger.log(
      `Bulk updating ${lessonUpdates.length} lessons for user ${userId}`,
    );

    try {
      const results = await Promise.all(
        lessonUpdates.map(async (update) => {
          const { data, error } = await this.supabaseService.client
            .from('user_progress_lesson')
            .update({ done: update.done })
            .eq('user_id', userId)
            .eq('lesson_id', update.lesson_id)
            .select();

          if (error) {
            this.logger.error(
              `Error updating lesson ${update.lesson_id}: ${error.message}`,
            );
            return null;
          }
          return data;
        }),
      );

      const updatedCount = results.filter((r) => r && r.length > 0).length;
      this.logger.log(`Successfully updated ${updatedCount} lessons`);

      return {
        message: 'Bulk update processed',
        updatedCount,
      };
    } catch (err) {
      this.logger.error(`Bulk update failed: ${err.message}`);
      throw new BadRequestException(
        'Failed to process bulk update: ' + err.message,
      );
    }
  }

  async deleteLearningPath(userId: string, careerId: number) {
    const { error } = await this.supabaseService.client
      .from('user_progress_career')
      .delete()
      .eq('user_id', userId)
      .eq('career_id', careerId);

    if (error) throw new BadRequestException(error.message);
    return { message: 'Learning path deleted successfully' };
  }
}

function mapGrowth(rate: number): string {
  if (rate >= 6) return 'High Growth';
  if (rate >= 3) return 'Medium Growth';
  return 'Stable Growth';
}
