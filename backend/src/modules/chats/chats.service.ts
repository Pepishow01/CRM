import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat, ChannelType, ConvStatus } from './entities/chat.entity';
import { Message, MessageDirection } from '../messages/entities/message.entity';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Chat)
    private chatsRepo: Repository<Chat>,
    @InjectRepository(Message)
    private messagesRepo: Repository<Message>,
  ) {}

  async createActivity(chatId: string, text: string): Promise<Message> {
    const msg = this.messagesRepo.create({
      chatId,
      direction: MessageDirection.OUTBOUND,
      contentType: 'activity',
      content: text,
      sentAt: new Date(),
      isPrivate: false,
    });
    return this.messagesRepo.save(msg);
  }

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
    data: { preview: string; timestamp: Date; isPrivate?: boolean; direction: 'inbound' | 'outbound' },
  ): Promise<void> {
    const chat = await this.chatsRepo.findOne({ where: { id: chatId } });
    
    if (chat && chat.lastMessageAt && data.timestamp < chat.lastMessageAt) {
      return;
    }

    const updateData: any = {
      lastMessagePreview: data.preview,
      lastMessageAt: data.timestamp,
      isLastMessagePrivate: data.isPrivate ?? false,
    };

    if (data.direction === 'inbound') {
      updateData.unreadCount = () => 'unread_count + 1';
    } else {
      updateData.unreadCount = 0; // Si respondemos, marcamos como leído
    }

    await this.chatsRepo.update(chatId, updateData);
  }

  async findAll(options?: { userId?: string; convStatus?: string }): Promise<Chat[]> {
    // Auto-reopen expired snoozed chats
    await this.chatsRepo
      .createQueryBuilder()
      .update(Chat)
      .set({ convStatus: ConvStatus.OPEN, snoozedUntil: null as any })
      .where('conv_status = :snoozed', { snoozed: ConvStatus.SNOOZED })
      .andWhere('snoozed_until IS NOT NULL')
      .andWhere('snoozed_until <= NOW()')
      .execute();

    const query = this.chatsRepo
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.contact', 'contact')
      .leftJoinAndSelect('chat.assignedTo', 'assignedTo')
      .orderBy('chat.lastMessageAt', 'DESC');

    if (options?.userId) {
      query.andWhere('chat.assignedTo = :userId', { userId: options.userId });
    }
    if (options?.convStatus) {
      query.andWhere('chat.conv_status = :convStatus', { convStatus: options.convStatus });
    }

    return query.getMany();
  }

  async setConvStatus(chatId: string, convStatus: ConvStatus): Promise<void> {
    const update: any = { convStatus };
    if (convStatus !== ConvStatus.SNOOZED) update.snoozedUntil = null;
    await this.chatsRepo.update(chatId, update);
  }

  async snooze(chatId: string, until: Date): Promise<void> {
    await this.chatsRepo.update(chatId, { convStatus: ConvStatus.SNOOZED, snoozedUntil: until });
  }

  async updateStatus(chatId: string, status: string): Promise<void> {
    await this.chatsRepo.update(chatId, { status: status as any });
  }

  async toggleBot(chatId: string, active: boolean): Promise<void> {
    await this.chatsRepo.update(chatId, { isBotActive: active });
  }

  async assignTo(chatId: string, userId: string | null): Promise<void> {
    await this.chatsRepo.update(chatId, {
      assignedTo: userId ? ({ id: userId } as any) : null,
    });
  }

  async assignTeam(chatId: string, teamId: string | null): Promise<void> {
    await this.chatsRepo.update(chatId, {
      team: teamId ? ({ id: teamId } as any) : null,
    });
  }

  async setPriority(chatId: string, priority: string): Promise<void> {
    await this.chatsRepo.update(chatId, { priority: priority as any });
  }

  async getParticipants(chatId: string): Promise<any[]> {
    const chat = await this.chatsRepo
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.participants', 'participants')
      .where('chat.id = :chatId', { chatId })
      .getOne();
    return chat?.participants || [];
  }

  async addParticipant(chatId: string, userId: string): Promise<void> {
    await this.chatsRepo
      .createQueryBuilder()
      .relation(Chat, 'participants')
      .of(chatId)
      .add(userId);
  }

  async removeParticipant(chatId: string, userId: string): Promise<void> {
    await this.chatsRepo
      .createQueryBuilder()
      .relation(Chat, 'participants')
      .of(chatId)
      .remove(userId);
  }

  async markAsRead(chatId: string): Promise<void> {
    await this.chatsRepo.update(chatId, { unreadCount: 0 });
  }

  async setLastInboundAt(chatId: string, timestamp: Date): Promise<void> {
    await this.chatsRepo.update(chatId, { lastInboundAt: timestamp });
  }

  async clearLastInboundAt(chatId: string): Promise<void> {
    await this.chatsRepo.update(chatId, { lastInboundAt: null as any });
  }

  async findByContact(contactId: string): Promise<Chat[]> {
    return this.chatsRepo
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.contact', 'contact')
      .leftJoinAndSelect('chat.assignedTo', 'assignedTo')
      .where('contact.id = :contactId', { contactId })
      .orderBy('chat.lastMessageAt', 'DESC')
      .getMany();
  }
}