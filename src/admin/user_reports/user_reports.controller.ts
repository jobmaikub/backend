import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UserReportsService } from './user_reports.service';
import { SupabaseAuthGuard } from '../../auth/supabase-auth.guard';
import { AdminGuard } from '../../auth/admin.guard';

@Controller('admin/user-reports')
@UseGuards(SupabaseAuthGuard, AdminGuard)
export class UserReportsController {
  constructor(private readonly service: UserReportsService) {}

  @Post()
  createReport(
    @Body()
    body: {
      by_user_id: string;
      report_user_id: string;
      reason: string;
      report_type?: string;
    },
  ) {
    return this.service.createReport(body);
  }

  @Get()
  getReports() {
    return this.service.getReports();
  }

  @Get('pending')
  getPendingReports() {
    return this.service.getPendingReports();
  }

  @Get(':reportId')
  getReportById(@Param('reportId') reportId: string) {
    return this.service.getReportById(reportId);
  }

  @Patch(':reportId')
  updateReport(
    @Param('reportId') reportId: string,
    @Body()
    body: {
      status?: string;
      reason?: string;
      resolved_by?: string;
      resolution_note?: string;
    },
  ) {
    return this.service.updateReport(reportId, body);
  }

  @Patch(':reportId/resolve-and-ban')
  resolveAndBanReport(
    @Param('reportId') reportId: string,
    @Body()
    body: {
      resolved_by: string;
      resolution_note?: string;
      ban_reason?: string;
      ban_until?: string;
    },
  ) {
    return this.service.resolveAndBanReport(reportId, body);
  }

  @Delete(':reportId')
  deleteReport(@Param('reportId') reportId: string) {
    return this.service.deleteReport(reportId);
  }
}
