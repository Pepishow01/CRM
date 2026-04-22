import { Injectable, Logger } from '@nestjs/common';
import { ContactsService } from '../../contacts/contacts.service';
import { ChatsService } from '../../chats/chats.service';
import { MessagesService } from '../../messages/messages.service';
import { ChatGateway } from '../../chats/chat.gateway';
import { NormalizedIncomingMessage } from '../dto/normalized-message.dto';
import { AiService } from '../../ai/ai.service';
import { WhatsAppSenderService } from '../../messages/whatsapp-sender.service';

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
  ) {}

  async process(msg: NormalizedIncomingMessage): Promise<void> {
    this.logger.log(`RECIBIDO: ${msg.contentType} - ID: ${msg.externalId} - MediaId: ${msg.mediaId}`);
    // console.log('DEBUG FULL MSG:', JSON.stringify(msg, null, 2));

    const existing = await this.messagesService.findByExternalId(msg.externalId);
    if (existing) {
      this.logger.log(`Mensaje ${msg.externalId} ya procesado — ignorando`);
      return;
    }

    const contact = await this.contactsService.upsertFromIncoming(msg);

    const chat = await this.chatsService.findOrCreate({
      contactId: contact.id,
      channel: msg.channel,
    });

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
    });

    await this.chatGateway.emitNewMessage({
      chatId: chat.id,
      message,
      contact,
      assignedTo: chat.assignedTo?.id ?? null,
    });

    this.logger.log(`Mensaje ${msg.externalId} guardado y emitido por WebSocket`);

    this.logger.log(`ESTADO BOT: chat.isBotActive=${chat.isBotActive}, type=${msg.contentType}, AI_ENABLED=${this.aiService.enabled}`);

    // --- LÓGICA DEL BOT AUTO-RESPUESTA ---
    if (chat.isBotActive && msg.contentType === 'text') {
      try {
        this.logger.log(`Bot activo para chat ${chat.id}. Generando respuesta...`);
        
        // 1. Obtener contexto (últimos 10 mensajes)
        const history = await this.messagesService.findByChatId(chat.id, { page: 1, limit: 10 });
        const conversation = this.aiService.formatConversation(history.reverse());
        
        // 2. Generar respuesta con Claude
        const reply = await this.aiService.generateAutoReply(conversation, contact.fullName);
        
        if (reply) {
          this.logger.log(`Enviando auto-respuesta a ${contact.whatsappPhone}: ${reply}`);
          
          let phone = contact.whatsappPhone;
          // Limpieza para Argentina: Meta no acepta el 9 (549... -> 54...)
          if (phone.startsWith('549') || phone.startsWith('+549')) {
            const cleanPhone = phone.startsWith('+') ? phone.slice(1) : phone;
            phone = '54' + cleanPhone.slice(3);
          }

          // 3. Enviar por WhatsApp
          const externalId = await this.whatsAppSender.sendText(phone, reply);
          
          // 4. Guardar respuesta del Bot en la DB
          const botMessage = await this.messagesService.create({
            chatId: chat.id,
            direction: 'outbound',
            channel: chat.channel,
            externalId,
            contentType: 'text',
            content: reply,
            sentAt: new Date(),
          });
          
          // 5. Actualizar preview del chat
          await this.chatsService.updateLastMessage(chat.id, {
            preview: reply.substring(0, 100),
            timestamp: new Date(),
          });
          
          // 6. Avisar al Frontend por Socket para que el vendedor vea lo que el bot respondió
          await this.chatGateway.emitNewMessage({
            chatId: chat.id,
            message: botMessage,
            contact,
            assignedTo: chat.assignedTo?.id ?? null,
          });
        }
      } catch (err) {
        this.logger.error(`Error en el Bot Auto-Respuesta: ${err.message}`);
      }
    }
  }
}