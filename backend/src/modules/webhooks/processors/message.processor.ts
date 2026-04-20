import { Injectable, Logger } from '@nestjs/common';
import { ContactsService } from '../../contacts/contacts.service';
import { ChatsService } from '../../chats/chats.service';
import { MessagesService } from '../../messages/messages.service';
import { NormalizedIncomingMessage } from '../dto/normalized-message.dto';

@Injectable()
export class MessageProcessor {
  private readonly logger = new Logger(MessageProcessor.name);

  constructor(
    private contactsService: ContactsService,
    private chatsService: ChatsService,
    private messagesService: MessagesService,
  ) {}

  async process(msg: NormalizedIncomingMessage): Promise<void> {
    this.logger.log(`Procesando mensaje ${msg.externalId} de ${msg.channel}`);

    // 1. Deduplicación
    const existing = await this.messagesService.findByExternalId(msg.externalId);
    if (existing) {
      this.logger.log(`Mensaje ${msg.externalId} ya procesado — ignorando`);
      return;
    }

    // 2. Upsert contacto
    const contact = await this.contactsService.upsertFromIncoming(msg);

    // 3. Encontrar o crear chat
    const chat = await this.chatsService.findOrCreate({
      contactId: contact.id,
      channel: msg.channel,
    });

    // 4. Guardar mensaje
    await this.messagesService.create({
      chatId: chat.id,
      direction: 'inbound',
      channel: msg.channel,
      externalId: msg.externalId,
      contentType: msg.contentType,
      content: msg.text,
      mediaUrl: msg.mediaUrl,
      metaPayload: msg.rawPayload,
      sentAt: msg.timestamp,
    });

    // 5. Actualizar preview del chat
    await this.chatsService.updateLastMessage(chat.id, {
      preview: msg.text?.substring(0, 100) ?? '[Media]',
      timestamp: msg.timestamp,
    });

    this.logger.log(`Mensaje ${msg.externalId} guardado correctamente`);
  }
}