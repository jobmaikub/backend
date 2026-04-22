import { Injectable } from '@nestjs/common';
import { SupabaseService } from './supabase/supabase.service';

@Injectable()
export class AppService {
  constructor(private readonly supabase: SupabaseService) {}

  getHello(): string {
    return 'Hello World!';
  }
}
