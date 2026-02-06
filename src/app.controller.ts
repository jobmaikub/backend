import { Controller, Get } from '@nestjs/common';
import { SupabaseService } from './supabase/supabase.service';

@Controller()
export class AppController {
  constructor(
    private readonly supabaseService: SupabaseService,
  ) {}

  @Get()
  getHello(): string {
    return 'Hello World!';
  }
}
