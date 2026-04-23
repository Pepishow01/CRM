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
      direction: 'inbound',
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
        
        // 1. Obtener contexto completo (últimos 100 mensajes)
        const historyData = await this.messagesService.findByChatId(chat.id, { page: 1, limit: 100 });
        const conversation = this.aiService.formatConversation(historyData);
        
        this.logger.log(`CONTEXTO ENVIADO A CLAUDE:\n${conversation}`);
        
        // 2. Generar respuesta con Claude
        const fullReply = await this.aiService.generateAutoReply(conversation, contact.fullName);
        
        if (fullReply) {
          // Dividir la respuesta en mensajes separados si hay saltos de línea dobles o el separador ---
          const messagesToSend = fullReply
            .split(/\n\n|---/)
            .map(m => m.trim())
            .filter(m => m.length > 0);

          for (const text of messagesToSend) {
            this.logger.log(`Enviando parte de auto-respuesta: ${text}`);
            
            let phone = contact.whatsappPhone;
            if (phone.startsWith('549') || phone.startsWith('+549')) {
              const cleanPhone = phone.startsWith('+') ? phone.slice(1) : phone;
              phone = '54' + cleanPhone.slice(3);
            }

            // 3. Enviar por WhatsApp
            const externalId = await this.whatsAppSender.sendText(phone, text);
            
            // 4. Guardar respuesta del Bot en la DB
            const botMessage = await this.messagesService.create({
              chatId: chat.id,
              direction: 'outbound',
              channel: chat.channel,
              externalId,
              contentType: 'text',
              content: text,
              sentAt: new Date(),
            });
            
            // 5. Actualizar preview del chat
            await this.chatsService.updateLastMessage(chat.id, {
              preview: text.substring(0, 100),
              timestamp: new Date(),
              direction: 'outbound',
            });
            
            // 6. Avisar al Frontend
            await this.chatGateway.emitNewMessage({
              chatId: chat.id,
              message: botMessage,
              contact,
              assignedTo: chat.assignedTo?.id ?? null,
            });

            // Pequeña pausa para que lleguen en orden
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch (err) {
        this.logger.error(`Error en el Bot Auto-Respuesta: ${err.message}`);
      }
    }
  }
}