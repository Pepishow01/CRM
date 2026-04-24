import {
  Controller, Get, Post, Delete, Param, Patch, Query,
  Body, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChatsService } from './chats.service';
import { ChatGateway } from './chat.gateway';
import { ConvStatus } from './entities/chat.entity';

@ApiTags('Chats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chats')
export class ChatsController {
  constructor(
    private chatsService: ChatsService,
    private chatGateway: ChatGateway,
  ) {}

  @Get()
  findAll(@Query('convStatus') convStatus?: string) {
    return this.chatsService.findAll({ convStatus });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chatsService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { status?: string; convStatus?: string; assignedTo?: string | null; teamId?: string | null; priority?: string },
    @Request() req: any,
  ) {
    const actor: string = req.user?.fullName || req.user?.email || 'Agente';
    const chat = await this.chatsService.findById(id);

    if (body.status !== undefined) {
      await this.chatsService.updateStatus(id, body.status);
      const msg = await this.chatsService.createActivity(id, `${actor} cambió el estado a "${body.status}"`);
      await this.chatGateway.emitNewMessage({ chatId: id, message: msg, contact: chat?.contact, assignedTo: chat?.assignedTo?.id ?? null });
      await this.chatGateway.emitChatUpdated(id);
      return;
    }
    if (body.convStatus !== undefined) {
      await this.chatsService.setConvStatus(id, body.convStatus as ConvStatus);
      const labels: Record<string, string> = { open: 'abierta', pending: 'pendiente', resolved: 'resuelta', snoozed: 'pospuesta' };
      const msg = await this.chatsService.createActivity(id, `${actor} marcó la conversación como ${labels[body.convStatus] ?? body.convStatus}`);
      await this.chatGateway.emitNewMessage({ chatId: id, message: msg, contact: chat?.contact, assignedTo: chat?.assignedTo?.id ?? null });
      await this.chatGateway.emitChatUpdated(id);
      return;
    }
    if (body.assignedTo !== undefined) {
      await this.chatsService.assignTo(id, body.assignedTo);
      const text = body.assignedTo ? `${actor} asignó la conversación` : `${actor} desasignó la conversación`;
      const msg = await this.chatsService.createActivity(id, text);
      await this.chatGateway.emitNewMessage({ chatId: id, message: msg, contact: chat?.contact, assignedTo: body.assignedTo ?? null });
      await this.chatGateway.emitChatUpdated(id);
      return;
    }
    if (body.teamId !== undefined) {
      await this.chatsService.assignTeam(id, body.teamId);
      const text = body.teamId ? `${actor} asignó al equipo` : `${actor} quitó el equipo`;
      const msg = await this.chatsService.createActivity(id, text);
      await this.chatGateway.emitNewMessage({ chatId: id, message: msg, contact: chat?.contact, assignedTo: chat?.assignedTo?.id ?? null });
      await this.chatGateway.emitChatUpdated(id);
      return;
    }
    if (body.priority !== undefined) {
      await this.chatsService.setPriority(id, body.priority);
      const msg = await this.chatsService.createActivity(id, `${actor} cambió la prioridad a "${body.priority}"`);
      await this.chatGateway.emitNewMessage({ chatId: id, message: msg, contact: chat?.contact, assignedTo: chat?.assignedTo?.id ?? null });
      await this.chatGateway.emitChatUpdated(id);
      return;
    }
    return this.chatsService.findById(id);
  }

  @Post(':id/snooze')
  async snooze(
    @Param('id') id: string,
    @Body() body: { until: string },
    @Request() req: any,
  ) {
    const actor: string = req.user?.fullName || req.user?.email || 'Agente';
    const until = new Date(body.until);
    await this.chatsService.snooze(id, until);
    const chat = await this.chatsService.findById(id);
    const msg = await this.chatsService.createActivity(id, `${actor} pospuso la conversación hasta ${until.toLocaleString('es-AR')}`);
    await this.chatGateway.emitNewMessage({ chatId: id, message: msg, contact: chat?.contact, assignedTo: chat?.assignedTo?.id ?? null });
    await this.chatGateway.emitChatUpdated(id);
    return { ok: true };
  }

  @Post(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.chatsService.markAsRead(id);
  }

  @Get(':id/contact-chats')
  findByContact(@Param('id') id: string) {
    return this.chatsService.findById(id).then((chat) =>
      chat?.contact?.id ? this.chatsService.findByContact(chat.contact.id) : [],
    );
  }

  @Get(':id/participants')
  getParticipants(@Param('id') id: string) {
    return this.chatsService.getParticipants(id);
  }

  @Post(':id/participants/:userId')
  addParticipant(@Param('id') id: string, @Param('userId') userId: string) {
    return this.chatsService.addParticipant(id, userId);
  }

  @Delete(':id/participants/:userId')
  removeParticipant(@Param('id') id: string, @Param('userId') userId: string) {
    return this.chatsService.removeParticipant(id, userId);
  }

  @Patch(':id/bot')
  toggleBot(
    @Param('id') id: string,
    @Body() body: { active: boolean },
  ) {
    return this.chatsService.toggleBot(id, body.active);
  }
}
