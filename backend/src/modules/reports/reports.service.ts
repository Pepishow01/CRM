import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Message } from '../messages/entities/message.entity';
import { Chat } from '../chats/entities/chat.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Message) private messagesRepo: Repository<Message>,
    @InjectRepository(Chat) private chatsRepo: Repository<Chat>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async getOverview(from: Date, to: Date) {
    const [totalChats, newChats, resolvedChats, totalMessages, inboundMessages, outboundMessages] =
      await Promise.all([
        this.chatsRepo.count(),
        this.chatsRepo.count({ where: { createdAt: Between(from, to) } }),
        this.chatsRepo.count({ where: { status: 'sold' as any } }),
        this.messagesRepo.count({ where: { sentAt: Between(from, to) } }),
        this.messagesRepo.count({ where: { direction: 'inbound' as any, sentAt: Between(from, to) } }),
        this.messagesRepo.count({ where: { direction: 'outbound' as any, sentAt: Between(from, to) } }),
      ]);

    return {
      totalChats,
      newChats,
      resolvedChats,
      totalMessages,
      inboundMessages,
      outboundMessages,
    };
  }

  async getMessagesByDay(from: Date, to: Date) {
    const rows = await this.messagesRepo
      .createQueryBuilder('m')
      .select(`DATE_TRUNC('day', m.sent_at)`, 'day')
      .addSelect('COUNT(*)', 'count')
      .addSelect(`SUM(CASE WHEN m.direction = 'inbound' THEN 1 ELSE 0 END)`, 'inbound')
      .addSelect(`SUM(CASE WHEN m.direction = 'outbound' THEN 1 ELSE 0 END)`, 'outbound')
      .where('m.sent_at BETWEEN :from AND :to', { from, to })
      .groupBy(`DATE_TRUNC('day', m.sent_at)`)
      .orderBy('day', 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      day: r.day,
      total: parseInt(r.count, 10),
      inbound: parseInt(r.inbound, 10),
      outbound: parseInt(r.outbound, 10),
    }));
  }

  async getChatsByStatus() {
    const rows = await this.chatsRepo
      .createQueryBuilder('c')
      .select('c.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.status')
      .getRawMany();

    return rows.map((r) => ({
      status: r.status,
      count: parseInt(r.count, 10),
    }));
  }

  async getChatsByChannel() {
    const rows = await this.chatsRepo
      .createQueryBuilder('c')
      .select('c.channel', 'channel')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.channel')
      .getRawMany();

    return rows.map((r) => ({
      channel: r.channel,
      count: parseInt(r.count, 10),
    }));
  }

  async getAgentStats(from: Date, to: Date) {
    const rows = await this.messagesRepo
      .createQueryBuilder('m')
      .leftJoin('m.sender', 'u')
      .select('u.id', 'userId')
      .addSelect('u.full_name', 'fullName')
      .addSelect('COUNT(*)', 'messagesSent')
      .where('m.direction = :dir', { dir: 'outbound' })
      .andWhere('m.sent_at BETWEEN :from AND :to', { from, to })
      .andWhere('u.id IS NOT NULL')
      .groupBy('u.id')
      .addGroupBy('u.full_name')
      .orderBy('messagesSent', 'DESC')
      .getRawMany();

    return rows.map((r) => ({
      userId: r.userId,
      fullName: r.fullName,
      messagesSent: parseInt(r.messagesSent, 10),
    }));
  }

  async getResponseTimes(from: Date, to: Date) {
    // Average time from first inbound to first outbound per chat in range
    const rows = await this.chatsRepo
      .createQueryBuilder('c')
      .select('c.id', 'chatId')
      .addSelect(
        `(SELECT MIN(m.sent_at) FROM messages m WHERE m.chat_id = c.id AND m.direction = 'outbound' AND m.sent_at BETWEEN :from AND :to)`,
        'firstResponse',
      )
      .addSelect(
        `(SELECT MIN(m.sent_at) FROM messages m WHERE m.chat_id = c.id AND m.direction = 'inbound' AND m.sent_at BETWEEN :from AND :to)`,
        'firstInbound',
      )
      .where('c.created_at BETWEEN :from AND :to')
      .setParameters({ from, to })
      .getRawMany();

    const withTimes = rows
      .filter((r) => r.firstResponse && r.firstInbound)
      .map((r) => ({
        chatId: r.chatId,
        responseTimeSeconds: Math.round(
          (new Date(r.firstResponse).getTime() - new Date(r.firstInbound).getTime()) / 1000,
        ),
      }))
      .filter((r) => r.responseTimeSeconds > 0);

    const avg =
      withTimes.length > 0
        ? Math.round(withTimes.reduce((a, b) => a + b.responseTimeSeconds, 0) / withTimes.length)
        : 0;

    return { averageResponseTimeSeconds: avg, samplesCount: withTimes.length };
  }
}
