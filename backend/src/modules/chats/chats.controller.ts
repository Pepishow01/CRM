import {
  Controller, Get, Param, Patch,
  Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChatsService } from './chats.service';

@ApiTags('Chats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chats')
export class ChatsController {
  constructor(private chatsService: ChatsService) {}

  @Get()
  findAll() {
    return this.chatsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chatsService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { status?: string; assignedTo?: string | null; teamId?: string | null; priority?: string },
  ) {
    if (body.status !== undefined) return this.chatsService.updateStatus(id, body.status);
    if (body.assignedTo !== undefined) return this.chatsService.assignTo(id, body.assignedTo);
    if (body.teamId !== undefined) return this.chatsService.assignTeam(id, body.teamId);
    if (body.priority !== undefined) return this.chatsService.setPriority(id, body.priority);
    return this.chatsService.findById(id);
  }

  @Get(':id/contact-chats')
  findByContact(@Param('id') id: string) {
    return this.chatsService.findById(id).then((chat) =>
      chat?.contact?.id ? this.chatsService.findByContact(chat.contact.id) : [],
    );
  }

  @Patch(':id/bot')
  toggleBot(
    @Param('id') id: string,
    @Body() body: { active: boolean },
  ) {
    return this.chatsService.toggleBot(id, body.active);
  }
}