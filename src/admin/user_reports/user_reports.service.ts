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
    by_user_id: string;
    report_user_id: string;
    reason: string;
    report_type?: string;
  }) {
    if (data.by_user_id === data.report_user_id) {
      throw new BadRequestException('Cannot report yourself');
    }

    const { data: result, error } =
      await this.supabaseService.client
        .from('user_reports')
        .insert({
          by_user_id: data.by_user_id,
          report_user_id: data.report_user_id,
          reason: data.reason,
          report_type: data.report_type ?? 'inappropriate',
          status: 'pending',
        })
        .select()
        .single();

    if (error) throw new BadRequestException(error.message);
    return result;
  }

  async getReports() {
    const { data, error } =
      await this.supabaseService.client
        .from('user_reports')
        .select(`
          report_id,
          by_user_id,
          report_user_id,
          reason,
          report_type,
          status,
          created_at,
          updated_at,
          reporter:by_user_id(id, email, full_name),
          reported_user:report_user_id(id, email, full_name)
        `)
        .order('created_at', { ascending: false });

    if (error) throw new NotFoundException(error.message);
    return data;
  }

  async getPendingReports() {
    const { data, error } =
      await this.supabaseService.client
        .from('user_reports')
        .select(`
          report_id,
          by_user_id,
          report_user_id,
          reason,
          report_type,
          status,
          created_at,
          reporter:by_user_id(id, email, full_name),
          reported_user:report_user_id(id, email, full_name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) throw new NotFoundException(error.message);
    return data;
  }

  async getReportById(reportId: string) {
    const { data, error } =
      await this.supabaseService.client
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
    reportId: string,
    data: {
      status?: string;
      reason?: string;
      resolved_by?: string;
      resolution_note?: string;
    },
  ) {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.reason !== undefined) updateData.reason = data.reason;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.resolved_by !== undefined) updateData.resolved_by = data.resolved_by;
    if (data.resolution_note !== undefined) updateData.resolution_note = data.resolution_note;

    if (data.status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data: result, error } =
      await this.supabaseService.client
        .from('user_reports')
        .update(updateData)
        .eq('report_id', reportId)
        .select()
        .single();

    if (error) throw new BadRequestException(error.message);
    if (!result) throw new NotFoundException('Report not found');

    return result;
  }

  async getReportsByUserId(userId: string) {
    const { data, error } =
      await this.supabaseService.client
        .from('user_reports')
        .select(`
          report_id,
          by_user_id,
          report_user_id,
          reason,
          report_type,
          status,
          created_at,
          reporter:by_user_id(id, email, full_name)
        `)
        .eq('report_user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw new NotFoundException(error.message);
    return data;
  }

  async deleteReport(reportId: string) {
    const { error } =
      await this.supabaseService.client
        .from('user_reports')
        .delete()
        .eq('report_id', reportId);

    if (error) throw new NotFoundException(error.message);
    return { success: true };
  }
}
