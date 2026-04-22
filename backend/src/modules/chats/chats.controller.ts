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
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.chatsService.updateStatus(id, body.status);
  }

  @Patch(':id/bot')
  toggleBot(
    @Param('id') id: string,
    @Body() body: { active: boolean },
  ) {
    return this.chatsService.toggleBot(id, body.active);
  }
}