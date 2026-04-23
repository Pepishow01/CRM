import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageDirection } from './entities/message.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepo: Repository<Message>,
  ) {}

  async create(data: {
    chatId: string;
    direction: 'inbound' | 'outbound';
    channel: string;
    externalId?: string;
    contentType: string;
    content?: string;
    mediaUrl?: string;
    metaPayload?: Record<string, any>;
    sentAt: Date;
    isPrivate?: boolean;
  }): Promise<Message> {
    const message = this.messagesRepo.create({
      chatId: data.chatId,
      direction: data.direction as MessageDirection,
      externalId: data.externalId,
      contentType: data.contentType,
      content: data.content,
      mediaUrl: data.mediaUrl,
      metaPayload: data.metaPayload ?? {},
      sentAt: data.sentAt,
      isPrivate: data.isPrivate ?? false,
    });
    return this.messagesRepo.save(message);
  }

  async updateExternalId(messageId: string, externalId: string): Promise<void> {
    await this.messagesRepo.update(messageId, { externalId });
  }

  async findByExternalId(externalId: string): Promise<Message | null> {
    return this.messagesRepo.findOne({ where: { externalId } });
  }

  async findByChatId(
    chatId: string,
    options: { page: number; limit: number },
  ): Promise<Message[]> {
    const { page, limit } = options;
    return this.messagesRepo.find({
      where: { chatId },
      order: { sentAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}