import {
  Controller, Get, Post, Param,
  Query, Body, UseGuards, Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';
import { ChatsService } from '../chats/chats.service';
import { WhatsAppSenderService } from './whatsapp-sender.service';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chats/:chatId/messages')
export class MessagesController {
  private readonly logger = new Logger(MessagesController.name);

  constructor(
    private messagesService: MessagesService,
    private chatsService: ChatsService,
    private whatsAppSender: WhatsAppSenderService,
  ) {}

  @Get()
  findAll(
    @Param('chatId') chatId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 1000,
  ) {
    return this.messagesService.findByChatId(chatId, {
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Post()
  async sendMessage(
    @Param('chatId') chatId: string,
    @Body() body: { text: string },
  ) {
    this.logger.log(`Intentando enviar mensaje a chat ${chatId}. Texto: ${body.text?.substring(0, 20)}...`);
    const chat = await this.chatsService.findById(chatId);
    if (!chat) {
      this.logger.error(`Chat ${chatId} no encontrado`);
      throw new Error('Chat no encontrado');
    }

    let externalId: string | undefined;

    // Enviar por WhatsApp si el canal es whatsapp
    if (chat.channel === 'whatsapp' && chat.contact?.whatsappPhone) {
      let phone = chat.contact.whatsappPhone.startsWith('+')
        ? chat.contact.whatsappPhone.slice(1)
        : chat.contact.whatsappPhone;
      // Argentina: Meta API no acepta el 9 de móvil (549XXXXXXXXX → 54XXXXXXXXX)
      if (phone.startsWith('549')) {
        phone = '54' + phone.slice(3);
      }
      externalId = await this.whatsAppSender.sendText(phone, body.text);
    }

    // Guardar el mensaje en la DB
    const message = await this.messagesService.create({
      chatId,
      direction: 'outbound',
      channel: chat.channel,
      externalId,
      contentType: 'text',
      content: body.text,
      sentAt: new Date(),
    });

    // Actualizar preview del chat
    await this.chatsService.updateLastMessage(chatId, {
      preview: body.text.substring(0, 100),
      timestamp: new Date(),
    });

    return message;
  }
}