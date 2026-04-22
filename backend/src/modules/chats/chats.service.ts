import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat, ChannelType } from './entities/chat.entity';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Chat)
    private chatsRepo: Repository<Chat>,
  ) {}

  async findOrCreate(data: {
    contactId: string;
    channel: string;
  }): Promise<Chat> {
    let chat = await this.chatsRepo
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.contact', 'contact')
      .leftJoinAndSelect('chat.assignedTo', 'assignedTo')
      .where('contact.id = :contactId', { contactId: data.contactId })
      .andWhere('chat.channel = :channel', { channel: data.channel })
      .getOne();

    if (!chat) {
      const newChat = new Chat();
      newChat.contact = { id: data.contactId } as any;
      newChat.channel = data.channel as ChannelType;
      const saved = await this.chatsRepo.save(newChat);
      chat = await this.chatsRepo
        .createQueryBuilder('chat')
        .leftJoinAndSelect('chat.contact', 'contact')
        .leftJoinAndSelect('chat.assignedTo', 'assignedTo')
        .where('chat.id = :id', { id: saved.id })
        .getOne();
    }

    return chat as Chat;
  }

  async findById(id: string): Promise<Chat> {
    return this.chatsRepo
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.contact', 'contact')
      .leftJoinAndSelect('chat.assignedTo', 'assignedTo')
      .where('chat.id = :id', { id })
      .getOne() as Promise<Chat>;
  }

  async updateLastMessage(
    chatId: string,
    data: { preview: string; timestamp: Date; isPrivate?: boolean },
  ): Promise<void> {
    const chat = await this.chatsRepo.findOne({ where: { id: chatId } });
    
    // Solo actualizar si el mensaje es más nuevo que el último registrado
    if (chat && chat.lastMessageAt && data.timestamp < chat.lastMessageAt) {
      return;
    }

    await this.chatsRepo.update(chatId, {
      lastMessagePreview: data.preview,
      lastMessageAt: data.timestamp,
      isLastMessagePrivate: data.isPrivate ?? false,
      unreadCount: () => 'unread_count + 1',
    });
  }

  async findAll(userId?: string): Promise<Chat[]> {
    const query = this.chatsRepo
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.contact', 'contact')
      .leftJoinAndSelect('chat.assignedTo', 'assignedTo')
      .orderBy('chat.lastMessageAt', 'DESC');

    if (userId) {
      query.where('chat.assignedTo = :userId', { userId });
    }

    return query.getMany();
  }

  async updateStatus(chatId: string, status: string): Promise<void> {
    await this.chatsRepo.update(chatId, { status: status as any });
  }

  async toggleBot(chatId: string, active: boolean): Promise<void> {
    await this.chatsRepo.update(chatId, { isBotActive: active });
  }
}