import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EmailService } from './email.service';

@ApiTags('Email')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('email')
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Get('inboxes')
  findAllInboxes() {
    return this.emailService.findAllInboxes();
  }

  @Post('inboxes')
  createInbox(@Body() body: any) {
    return this.emailService.createInbox(body);
  }

  @Patch('inboxes/:id')
  updateInbox(@Param('id') id: string, @Body() body: any) {
    return this.emailService.updateInbox(id, body);
  }

  @Delete('inboxes/:id')
  removeInbox(@Param('id') id: string) {
    return this.emailService.removeInbox(id);
  }

  @Post('send/:chatId')
  sendEmail(
    @Param('chatId') chatId: string,
    @Body() body: { subject: string; html: string },
    @Request() req: any,
  ) {
    return this.emailService.sendEmail(chatId, body.subject, body.html, req.user.userId);
  }
}
