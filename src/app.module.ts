import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { HomeModule } from './home/home.module';
import { ScheduleModule } from '@nestjs/schedule';
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
import { LearningPathModule } from './progresss/LearningPath/LearningPath.module';
import { AiModule } from './ai/ai.module';
import { OtpModule } from './otp/otp.module';
import { TrackProgressModule } from './progresss/track_progress/track_progress.module';
import { ReviewsModule } from './admin/reviews/reviews.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { StatsModule } from './admin/stats/stats.module';

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
    LearningPathModule,
    AiModule,
    TrackProgressModule,
    ReviewsModule,
    BookmarksModule,
    OtpModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
