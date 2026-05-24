import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class UserReportsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async createReport(data: {
    by_user_id: string;
    report_user_id: string;
    reason: string;
    report_type?: string;
  }) {
    if (data.by_user_id === data.report_user_id) {
      throw new BadRequestException('Cannot report yourself');
    }

    const { data: result, error } = await this.supabaseService.client
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
    const { data, error } = await this.supabaseService.client
      .from('user_reports')
      .select(
        `
          report_id,
          by_user_id,
          report_user_id,
          reason,
          report_type,
          status,
          created_at,
          updated_at,
          review_id,
          review:review_id(career_id),
          reporter:by_user_id(id, email, full_name),
          reported_user:report_user_id(id, email, full_name)
        `,
      )
      .order('created_at', { ascending: false });

    if (error) throw new NotFoundException(error.message);
    return data;
  }

  async getPendingReports() {
    const { data, error } = await this.supabaseService.client
      .from('user_reports')
      .select(
        `
          report_id,
          by_user_id,
          report_user_id,
          reason,
          report_type,
          status,
          created_at,
          review_id,
          review:review_id(career_id),
          reporter:by_user_id(id, email, full_name),
          reported_user:report_user_id(id, email, full_name)
        `,
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw new NotFoundException(error.message);
    return data;
  }

  async getReportById(reportId: string) {
    const { data, error } = await this.supabaseService.client
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
    if (data.resolved_by !== undefined)
      updateData.resolved_by = data.resolved_by;
    if (data.resolution_note !== undefined)
      updateData.resolution_note = data.resolution_note;

    if (data.status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data: result, error } = await this.supabaseService.client
      .from('user_reports')
      .update(updateData)
      .eq('report_id', reportId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    if (!result) throw new NotFoundException('Report not found');

    return result;
  }

  async resolveAndBanReport(
    reportId: string,
    data: {
      resolved_by: string;
      resolution_note?: string;
      ban_reason?: string;
      ban_until?: string;
    },
  ) {
    const { data: report, error: reportError } =
      await this.supabaseService.client
        .from('user_reports')
        .select('report_id, report_user_id, reason, status')
        .eq('report_id', reportId)
        .maybeSingle();

    if (reportError) throw new BadRequestException(reportError.message);
    if (!report) throw new NotFoundException('Report not found');

    const nowIso = new Date().toISOString();

    const { data: activeBans, error: activeBanError } =
      await this.supabaseService.client
        .from('ban_users')
        .select('ban_id, user_id, unban_date')
        .eq('user_id', report.report_user_id)
        .or(`unban_date.is.null,unban_date.gt.${nowIso}`)
        .order('ban_date', { ascending: false })
        .limit(1);

    if (activeBanError) {
      throw new BadRequestException(activeBanError.message);
    }

    const activeBan = activeBans?.[0] ?? null;

    let banResult = activeBan;
    if (!activeBan) {
      const banReason =
        data.ban_reason ?? `Resolved from report ${reportId}: ${report.reason}`;

      const { data: insertedBan, error: banError } =
        await this.supabaseService.client
          .from('ban_users')
          .insert({
            user_id: report.report_user_id,
            reason: banReason,
            unban_date: data.ban_until ?? null,
            created_by: data.resolved_by,
          })
          .select()
          .single();

      if (banError) throw new BadRequestException(banError.message);
      banResult = insertedBan;
    }

    const { error: profileUpdateError } = await this.supabaseService.client
      .from('profiles')
      .update({ is_banned: true })
      .eq('id', report.report_user_id);

    if (profileUpdateError) {
      throw new BadRequestException(profileUpdateError.message);
    }

    const now = new Date().toISOString();
    const resolutionNote =
      data.resolution_note ?? `Resolved by admin from report ${reportId}`;

    const { data: resolvedReports, error: resolveReportsError } =
      await this.supabaseService.client
        .from('user_reports')
        .update({
          status: 'resolved',
          resolved_by: data.resolved_by,
          resolution_note: resolutionNote,
          resolved_at: now,
          updated_at: now,
        })
        .eq('report_user_id', report.report_user_id)
        .eq('status', 'pending')
        .select(
          'report_id, status, updated_at, resolved_at, resolved_by, resolution_note',
        );

    if (resolveReportsError) {
      throw new BadRequestException(resolveReportsError.message);
    }

    let primaryResolvedReport = resolvedReports?.find(
      (r) => r.report_id === reportId,
    );

    if (!primaryResolvedReport) {
      const { data: fallbackReport, error: fallbackError } =
        await this.supabaseService.client
          .from('user_reports')
          .select(
            'report_id, status, updated_at, resolved_at, resolved_by, resolution_note',
          )
          .eq('report_id', reportId)
          .maybeSingle();

      if (fallbackError) {
        throw new BadRequestException(fallbackError.message);
      }

      if (!fallbackReport) {
        throw new NotFoundException('Report not found after resolve');
      }

      primaryResolvedReport = fallbackReport;
    }

    return {
      report: primaryResolvedReport,
      ban: banResult,
      alreadyBanned: !!activeBan,
      report_user_id: report.report_user_id,
      resolved_report_ids: (resolvedReports ?? []).map((r) => r.report_id),
      resolved_count: resolvedReports?.length ?? 0,
    };
  }

  async getReportsByUserId(userId: string) {
    const { data, error } = await this.supabaseService.client
      .from('user_reports')
      .select(
        `
          report_id,
          by_user_id,
          report_user_id,
          reason,
          report_type,
          status,
          created_at,
          review_id,
          reporter:by_user_id(id, email, full_name)
        `,
      )
      .eq('report_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new NotFoundException(error.message);
    return data;
  }

  async deleteReport(reportId: string) {
    const { error } = await this.supabaseService.client
      .from('user_reports')
      .delete()
      .eq('report_id', reportId);

    if (error) throw new NotFoundException(error.message);
    return { success: true };
  }
}
