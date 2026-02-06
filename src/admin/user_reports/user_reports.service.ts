import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class UserReportsService {
  constructor(
    private readonly supabaseService: SupabaseService,
  ) {}

  async createReport(data: {
    by_user_id: number;
    report_user_id: number;
    reason: string;
  }) {
    if (data.by_user_id === data.report_user_id) {
      throw new BadRequestException('Cannot report yourself');
    }

    const { data: result, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('user_reports')
        .insert(data)
        .select()
        .single();

    if (error) throw new BadRequestException(error.message);
    return result;
  }

  async getReports() {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('user_reports')
        .select('*')
        .order('last_update', { ascending: false });

    if (error) throw new NotFoundException(error.message);
    return data;
  }

  async getReportById(reportId: number) {
    const { data, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('user_reports')
        .select('*')
        .eq('report_id', reportId)
        .single();

    if (error || !data) {
      throw new NotFoundException('Report not found');
    }

    return data;
  }

  async updateReport(
    reportId: number,
    data: {
      reason?: string;
    },
  ) {
    const { data: result, error } =
      await this.supabaseService.client
        .schema('admin')
        .from('user_reports')
        .update({
          ...data,
          last_update: new Date(),
        })
        .eq('report_id', reportId)
        .select()
        .single();

    if (error) throw new BadRequestException(error.message);
    if (!result) throw new NotFoundException('Report not found');

    return result;
  }

  async deleteReport(reportId: number) {
    const { error } =
      await this.supabaseService.client
        .schema('admin')
        .from('user_reports')
        .delete()
        .eq('report_id', reportId);

    if (error) throw new NotFoundException(error.message);
    return { success: true };
  }
}
