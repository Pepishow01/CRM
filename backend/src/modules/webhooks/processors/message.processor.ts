import { Injectable, Logger } from '@nestjs/common';
import { ContactsService } from '../../contacts/contacts.service';
import { ChatsService } from '../../chats/chats.service';
import { MessagesService } from '../../messages/messages.service';
import { ChatGateway } from '../../chats/chat.gateway';
import { NormalizedIncomingMessage } from '../dto/normalized-message.dto';

@Injectable()
export class MessageProcessor {
  private readonly logger = new Logger(MessageProcessor.name);

  constructor(
    private contactsService: ContactsService,
    private chatsService: ChatsService,
    private messagesService: MessagesService,
    private chatGateway: ChatGateway,
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
  }
}