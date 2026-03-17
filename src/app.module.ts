import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';

import { SupabaseModule } from './supabase/supabase.module';
import { HomeModule } from './modules/home/home.module';

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
import { IndustriesModule } from './admin/industries/industries.module'; // ✅ เพิ่ม

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
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
  ],
  controllers: [AppController],
})
export class AppModule {}
