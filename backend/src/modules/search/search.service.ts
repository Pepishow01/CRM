import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Contact } from '../contacts/entities/contact.entity';
import { Chat } from '../chats/entities/chat.entity';
import { Message } from '../messages/entities/message.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Contact) private contactsRepo: Repository<Contact>,
    @InjectRepository(Chat) private chatsRepo: Repository<Chat>,
    @InjectRepository(Message) private messagesRepo: Repository<Message>,
  ) {}

  async globalSearch(query: string) {
    if (!query || query.trim().length < 2) {
      return { contacts: [], chats: [], messages: [] };
    }

    const q = `%${query.trim()}%`;

    const [contacts, messages] = await Promise.all([
      this.contactsRepo.find({
        where: [
          { fullName: ILike(q) },
          { email: ILike(q) },
          { phone: ILike(q) },
          { whatsappPhone: ILike(q) },
        ],
        take: 10,
      }),
      this.messagesRepo
        .createQueryBuilder('m')
        .leftJoinAndSelect('m.chat', 'chat')
        .leftJoinAndSelect('chat.contact', 'contact')
        .where('m.content ILIKE :q', { q })
        .andWhere('m.content_type = :type', { type: 'text' })
        .orderBy('m.sent_at', 'DESC')
        .take(10)
        .getMany(),
    ]);

    const chatIds = [...new Set(messages.map((m) => m.chatId))];
    const chats = chatIds.length
      ? await this.chatsRepo
          .createQueryBuilder('chat')
          .leftJoinAndSelect('chat.contact', 'contact')
          .leftJoinAndSelect('chat.assignedTo', 'assignedTo')
          .where('chat.id IN (:...ids)', { ids: chatIds })
          .getMany()
      : [];

    return { contacts, chats, messages };
  }

  async filterChats(filters: {
    status?: string;
    channel?: string;
    assignedTo?: string;
    labelId?: string;
    from?: string;
    to?: string;
  }) {
    let query = this.chatsRepo
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.contact', 'contact')
      .leftJoinAndSelect('chat.assignedTo', 'assignedTo')
      .leftJoinAndSelect('chat.labels', 'labels');

    if (filters.status) {
      query = query.andWhere('chat.status = :status', { status: filters.status });
    }
    if (filters.channel) {
      query = query.andWhere('chat.channel = :channel', { channel: filters.channel });
    }
    if (filters.assignedTo) {
      query = query.andWhere('chat.assigned_to = :assignedTo', { assignedTo: filters.assignedTo });
    }
    if (filters.labelId) {
      query = query.andWhere('labels.id = :labelId', { labelId: filters.labelId });
    }
    if (filters.from) {
      query = query.andWhere('chat.created_at >= :from', { from: new Date(filters.from) });
    }
    if (filters.to) {
      query = query.andWhere('chat.created_at <= :to', { to: new Date(filters.to) });
    }

    return query.orderBy('chat.last_message_at', 'DESC').getMany();
  }
}
