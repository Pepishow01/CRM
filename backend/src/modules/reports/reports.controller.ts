import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';

function parseDateRange(from?: string, to?: string): { from: Date; to: Date } {
  const now = new Date();
  const parsedTo = to ? new Date(to) : now;
  const parsedFrom = from
    ? new Date(from)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: parsedFrom, to: parsedTo };
}

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('overview')
  getOverview(@Query('from') from?: string, @Query('to') to?: string) {
    const range = parseDateRange(from, to);
    return this.service.getOverview(range.from, range.to);
  }

  @Get('messages-by-day')
  getMessagesByDay(@Query('from') from?: string, @Query('to') to?: string) {
    const range = parseDateRange(from, to);
    return this.service.getMessagesByDay(range.from, range.to);
  }

  @Get('chats-by-status')
  getChatsByStatus() {
    return this.service.getChatsByStatus();
  }

  @Get('chats-by-channel')
  getChatsByChannel() {
    return this.service.getChatsByChannel();
  }

  @Get('agent-stats')
  getAgentStats(@Query('from') from?: string, @Query('to') to?: string) {
    const range = parseDateRange(from, to);
    return this.service.getAgentStats(range.from, range.to);
  }

  @Get('response-times')
  getResponseTimes(@Query('from') from?: string, @Query('to') to?: string) {
    const range = parseDateRange(from, to);
    return this.service.getResponseTimes(range.from, range.to);
  }
}
