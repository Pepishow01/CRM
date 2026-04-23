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
    @Body() body: { status?: string; assignedTo?: string | null },
  ) {
    if (body.status) return this.chatsService.updateStatus(id, body.status);
    if (body.assignedTo !== undefined) return this.chatsService.assignTo(id, body.assignedTo);
    return this.chatsService.findById(id);
  }

  @Patch(':id/bot')
  toggleBot(
    @Param('id') id: string,
    @Body() body: { active: boolean },
  ) {
    return this.chatsService.toggleBot(id, body.active);
  }
}