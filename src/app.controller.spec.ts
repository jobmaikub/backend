/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseService } from './supabase/supabase.service';
import { ReviewsService } from './admin/reviews/reviews.service';
import { TrackProgressService } from './progresss/track_progress/track_progress.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHello: () => 'Hello World!',
          },
        },
        {
          provide: SupabaseService,
          useValue: {},
        },
        {
          provide: ReviewsService,
          useValue: {},
        },
        {
          provide: TrackProgressService,
          useValue: {},
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
