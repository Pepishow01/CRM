import { Injectable, Logger } from '@nestjs/common';
import { ContactsService } from '../../contacts/contacts.service';
import { ChatsService } from '../../chats/chats.service';
import { ConvStatus } from '../../chats/entities/chat.entity';
import { MessagesService } from '../../messages/messages.service';
import { ChatGateway } from '../../chats/chat.gateway';
import { NormalizedIncomingMessage } from '../dto/normalized-message.dto';
import { AiService } from '../../ai/ai.service';
import { WhatsAppSenderService } from '../../messages/whatsapp-sender.service';
import { SettingsService } from '../../settings/settings.service';
import { UsersService } from '../../users/users.service';
import { AutomationsService } from '../../automations/automations.service';
import { AutomationTrigger } from '../../automations/entities/automation.entity';

@Injectable()
export class MessageProcessor {
  private readonly logger = new Logger(MessageProcessor.name);

  constructor(
    private contactsService: ContactsService,
    private chatsService: ChatsService,
    private messagesService: MessagesService,
    private chatGateway: ChatGateway,
    private aiService: AiService,
    private whatsAppSender: WhatsAppSenderService,
    private settingsService: SettingsService,
    private usersService: UsersService,
    private automationsService: AutomationsService,
  ) {}

  async process(msg: NormalizedIncomingMessage): Promise<void> {
    this.logger.log(`RECIBIDO: ${msg.contentType} - ID: ${msg.externalId}`);

    const existing = await this.messagesService.findByExternalId(msg.externalId);
    if (existing) {
      this.logger.log(`Mensaje ${msg.externalId} ya procesado — ignorando`);
      return;
    }

    const contact = await this.contactsService.upsertFromIncoming(msg);
    const isNewChat = !(await this.chatsService.findOrCreate({ contactId: contact.id, channel: msg.channel }).then(() => false).catch(() => false));

    const chat = await this.chatsService.findOrCreate({
      contactId: contact.id,
      channel: msg.channel,
    });

    const chatJustCreated = !chat.lastMessageAt;

    // --- AUTO-ASIGNACIÓN (round-robin) ---
    if (!chat.assignedTo) {
      try {
        const raw = await this.settingsService.get('auto_assign');
        if (raw) {
          const config = JSON.parse(raw);
          if (config.enabled && config.agentIds?.length > 0) {
            const idxRaw = await this.settingsService.get('auto_assign_idx') ?? '0';
            const idx = parseInt(idxRaw, 10) % config.agentIds.length;
            const agentId = config.agentIds[idx];
            await this.chatsService.assignTo(chat.id, agentId);
            chat.assignedTo = { id: agentId } as any;
            await this.settingsService.set('auto_assign_idx', String((idx + 1) % config.agentIds.length));
            this.logger.log(`Auto-asignado chat ${chat.id} al agente ${agentId}`);
          }
        }
      } catch (e) { this.logger.warn(`Auto-assign error: ${e.message}`); }
    }

    const message = await this.messagesService.create({
      chatId: chat.id,
      direction: 'inbound',
      channel: msg.channel,
      externalId: msg.externalId,
      contentType: msg.contentType,
      content: msg.text,
      mediaUrl: msg.mediaId ? `/media/${msg.mediaId}` : undefined,
      metaPayload: msg.rawPayload,
      sentAt: msg.timestamp,
    });

    await this.chatsService.updateLastMessage(chat.id, {
      preview: msg.text?.substring(0, 100) ?? '[Media]',
      timestamp: msg.timestamp,
      direction: 'inbound',
    });

    // Track SLA: when inbound arrives, mark waiting time start
    await this.chatsService.setLastInboundAt(chat.id, msg.timestamp);

    await this.chatGateway.emitNewMessage({
      chatId: chat.id,
      message,
      contact,
      assignedTo: chat.assignedTo?.id ?? null,
    });

    this.logger.log(`Mensaje ${msg.externalId} guardado y emitido por WebSocket`);

    // --- HORARIO DE ATENCIÓN ---
    if (msg.contentType === 'text' && chat.channel === 'whatsapp' && contact.whatsappPhone) {
      try {
        const bhRaw = await this.settingsService.get('business_hours');
        if (bhRaw) {
          const bh = JSON.parse(bhRaw);
          if (bh.enabled && !this.isWithinBusinessHours(bh) && bh.autoReplyMessage) {
            let phone = contact.whatsappPhone.startsWith('+')
              ? contact.whatsappPhone.slice(1) : contact.whatsappPhone;
            if (phone.startsWith('549')) phone = '54' + phone.slice(3);
            await this.whatsAppSender.sendText(phone, bh.autoReplyMessage);
            await this.messagesService.create({
              chatId: chat.id, direction: 'outbound', channel: chat.channel,
              contentType: 'text', content: bh.autoReplyMessage, sentAt: new Date(),
            });
            this.logger.log(`Fuera de horario: respuesta automática enviada a ${phone}`);
          }
        }
      } catch (e) { this.logger.warn(`Business hours error: ${e.message}`); }
    }

    // --- AUTOMATIZACIONES ---
    try {
      const trigger = chatJustCreated
        ? AutomationTrigger.CONVERSATION_CREATED
        : AutomationTrigger.MESSAGE_RECEIVED;
      await this.automationsService.execute(trigger, { chat, message });
    } catch (e) { this.logger.warn(`Automations error: ${e.message}`); }

    // --- BOT AUTO-RESPUESTA ---
    this.logger.log(`ESTADO BOT: chat.isBotActive=${chat.isBotActive}, convStatus=${chat.convStatus}, type=${msg.contentType}`);
    if ((chat.isBotActive || chat.convStatus === ConvStatus.PENDING) && msg.contentType === 'text') {
      try {
        this.logger.log(`Bot activo para chat ${chat.id}. Generando respuesta...`);
        const historyData = await this.messagesService.findByChatId(chat.id, { page: 1, limit: 30 });
        const fullReply = await this.aiService.generateAutoReply(historyData, contact.fullName);

        if (fullReply) {
          const messagesToSend = fullReply.split(/\n\n|---/).map(m => m.trim()).filter(m => m.length > 0);
          for (const text of messagesToSend) {
            let phone = contact.whatsappPhone;
            if (phone.startsWith('549') || phone.startsWith('+549')) {
              const cleanPhone = phone.startsWith('+') ? phone.slice(1) : phone;
              phone = '54' + cleanPhone.slice(3);
            }
            const externalId = await this.whatsAppSender.sendText(phone, text);
            const botMessage = await this.messagesService.create({
              chatId: chat.id, direction: 'outbound', channel: chat.channel,
              externalId, contentType: 'text', content: text, sentAt: new Date(),
            });
            await this.chatsService.updateLastMessage(chat.id, {
              preview: text.substring(0, 100), timestamp: new Date(), direction: 'outbound',
            });
            await this.chatGateway.emitNewMessage({
              chatId: chat.id, message: botMessage, contact, assignedTo: chat.assignedTo?.id ?? null,
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch (err) {
        this.logger.error(`Error en el Bot Auto-Respuesta: ${err.message}`);
      }
    }
  }

  private isWithinBusinessHours(bh: any): boolean {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const tz = bh.timezone || 'America/Argentina/Buenos_Aires';
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
    const dayKey = days[now.getDay()];
    const dayConfig = bh.hours?.[dayKey];
    if (!dayConfig?.open) return false;
    const [fh, fm] = dayConfig.from.split(':').map(Number);
    const [th, tm] = dayConfig.to.split(':').map(Number);
    const current = now.getHours() * 60 + now.getMinutes();
    return current >= fh * 60 + fm && current <= th * 60 + tm;
  }
}
