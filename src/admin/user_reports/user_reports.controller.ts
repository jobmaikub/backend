import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { UserReportsService } from './user_reports.service';

@Controller('user-reports')
export class UserReportsController {
  constructor(private readonly service: UserReportsService) {}

  @Post()
  createReport(
    @Body()
    body: {
      by_user_id: number;
      report_user_id: number;
      reason: string;
    },
  ) {
    return this.service.createReport(body);
  }

  @Get()
  getReports() {
    return this.service.getReports();
  }

  @Get(':id')
  getReportById(@Param('id') id: string) {
    return this.service.getReportById(Number(id));
  }

  @Patch(':id')
  updateReport(
    @Param('id') id: string,
    @Body()
    body: {
      reason?: string;
    },
  ) {
    return this.service.updateReport(Number(id), body);
  }

  @Delete(':id')
  deleteReport(@Param('id') id: string) {
    return this.service.deleteReport(Number(id));
  }
}
