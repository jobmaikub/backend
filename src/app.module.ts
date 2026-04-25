import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { HomeModule } from './home/home.module';

// Import ของ News Cron Job
import { ScheduleModule } from '@nestjs/schedule';
import { NewsService } from './admin/news/news.service';

import { CareersModule } from './admin/careers/careers.module';
import { CoursesModule } from './admin/courses/courses.module';
import { FacultiesModule } from './admin/faculties/faculties.module';
import { LessonsModule } from './admin/lessons/lessons.module';
import { MajorsModule } from './admin/majors/majors.module';
import { InterestsModule } from './admin/interests/interests.module';
import { NewsModule } from './admin/news/news.module';
import { SkillsModule } from './admin/skills/skills.module';
import { UsersModule } from './admin/users/users.module';
import { UserReportsModule } from './admin/user_reports/user_reports.module';
import { BanUsersModule } from './admin/ban_users/ban_users.module';
import { IndustriesModule } from './admin/industries/industries.module';
import { JobPathAllCareerModule } from './progresss/job_path_all_career/job_path_all_career.module';
import { JobPathCareerModule } from './progresss/job_path_career/job_path_career.module';
import { JobPathLessonModule } from './progresss/job_path_lesson/job_path_lesson.module';
import { AiModule } from './ai/ai.module';
import { OtpController } from './otp/otp.controller';
import { OtpService } from './otp/otp.service';
import { TrackProgressModule } from './progresss/track_progress/track_progress.module';
import { ReviewsModule } from './admin/reviews/reviews.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    SupabaseModule,
    HomeModule,
    CareersModule,
    CoursesModule,
    FacultiesModule,
    LessonsModule,
    MajorsModule,
    NewsModule,
    SkillsModule,
    UsersModule,
    UserReportsModule,
    BanUsersModule,
    InterestsModule,
    IndustriesModule,
    JobPathAllCareerModule,
    JobPathCareerModule,
    JobPathLessonModule,
    AiModule,
    TrackProgressModule,
    ReviewsModule,
    BookmarksModule,
  ],
  controllers: [AppController, OtpController],
  providers: [AppService, OtpService, NewsService],
})
export class AppModule { }
