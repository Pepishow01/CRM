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
    private chatGateway: ChatGateway,
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
    @Body() body: { text: string; isPrivate?: boolean },
  ) {
    this.logger.log(`Intentando enviar mensaje a chat ${chatId}. Privado: ${body.isPrivate}. Texto: ${body.text?.substring(0, 20)}...`);
    const chat = await this.chatsService.findById(chatId);
    if (!chat) {
      this.logger.error(`Chat ${chatId} no encontrado`);
      throw new Error('Chat no encontrado');
    }

    let externalId: string | undefined;

    // Enviar por WhatsApp si el canal es whatsapp Y NO ES PRIVADO
    if (!body.isPrivate && chat.channel === 'whatsapp' && chat.contact?.whatsappPhone) {
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
      isPrivate: body.isPrivate ?? false,
    });

    // Actualizar preview del chat
    await this.chatsService.updateLastMessage(chatId, {
      preview: body.text.substring(0, 100),
      timestamp: new Date(),
      isPrivate: body.isPrivate ?? false,
      direction: 'outbound',
    });

    // Avisar al Frontend para actualizar la barra lateral
    await this.chatGateway.emitNewMessage({
      chatId,
      message,
      contact: chat.contact,
      assignedTo: chat.assignedTo?.id ?? null,
    });

    return message;
  }

  @Get('templates')
  async getTemplates() {
    return this.whatsAppSender.getTemplates();
  }

  @Post('template')
  async sendTemplate(
    @Param('chatId') chatId: string,
    @Body() body: { templateName: string; languageCode: string },
  ) {
    const chat = await this.chatsService.findById(chatId);
    if (!chat || !chat.contact?.whatsappPhone) throw new Error('Chat o teléfono no encontrado');

    const externalId = await this.whatsAppSender.sendTemplate(
      chat.contact.whatsappPhone,
      body.templateName,
      body.languageCode,
    );

    return this.messagesService.create({
      chatId,
      direction: 'outbound',
      channel: 'whatsapp',
      externalId,
      contentType: 'template',
      content: `Plantilla: ${body.templateName}`,
      sentAt: new Date(),
    });
  }

  @Post('media')
  async sendMedia(
    @Param('chatId') chatId: string,
    @Body() body: { mediaId: string; contentType: string; filename?: string },
  ) {
    const chat = await this.chatsService.findById(chatId);
    if (!chat || !chat.contact?.whatsappPhone) throw new Error('Chat o teléfono no encontrado');

    let type: 'image' | 'audio' | 'document' | 'video' = 'document';
    if (body.contentType.startsWith('image/')) type = 'image';
    else if (body.contentType.startsWith('audio/')) type = 'audio';
    else if (body.contentType.startsWith('video/')) type = 'video';

    const externalId = await this.whatsAppSender.sendMediaById(
      chat.contact.whatsappPhone,
      body.mediaId,
      type,
    );

    return this.messagesService.create({
      chatId,
      direction: 'outbound',
      channel: 'whatsapp',
      externalId,
      contentType: type,
      content: body.filename || `Archivo ${type}`,
      mediaUrl: `/api/v1/media/${body.mediaId}`,
      sentAt: new Date(),
    });
  }
}