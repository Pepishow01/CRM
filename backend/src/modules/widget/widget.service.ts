import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WidgetConfig } from './entities/widget-config.entity';
import { Chat, ChannelType } from '../chats/entities/chat.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { Message, MessageDirection } from '../messages/entities/message.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class WidgetService {
  constructor(
    @InjectRepository(WidgetConfig) private configRepo: Repository<WidgetConfig>,
    @InjectRepository(Chat) private chatsRepo: Repository<Chat>,
    @InjectRepository(Contact) private contactsRepo: Repository<Contact>,
    @InjectRepository(Message) private messagesRepo: Repository<Message>,
  ) {}

  private async validateToken(token: string): Promise<WidgetConfig> {
    const config = await this.configRepo.findOne({ where: { token, isActive: true } });
    if (!config) throw new UnauthorizedException('Token de widget inválido');
    return config;
  }

  async getConfig(token: string) {
    const config = await this.configRepo.findOne({ where: { token, isActive: true } });
    if (!config) throw new NotFoundException('Widget no encontrado');
    return {
      name: config.name,
      welcomeMessage: config.welcomeMessage ?? '¡Hola! ¿En qué te puedo ayudar?',
      color: config.color,
    };
  }

  async listConfigs(): Promise<WidgetConfig[]> {
    return this.configRepo.find({ order: { createdAt: 'DESC' } });
  }

  async createConfig(data: { name: string; welcomeMessage?: string; color?: string }): Promise<WidgetConfig> {
    const token = randomBytes(16).toString('hex');
    const config = this.configRepo.create({ ...data, token });
    return this.configRepo.save(config);
  }

  async createConversation(data: {
    widgetToken: string;
    visitorName: string;
    visitorEmail?: string;
    message: string;
  }): Promise<{ chatId: string }> {
    await this.validateToken(data.widgetToken);

    let contact = data.visitorEmail
      ? await this.contactsRepo.findOne({ where: { email: data.visitorEmail } })
      : null;

    if (!contact) {
      contact = this.contactsRepo.create({
        fullName: data.visitorName,
        email: data.visitorEmail,
      });
      contact = await this.contactsRepo.save(contact);
    }

    const chat = await this.chatsRepo.save(
      this.chatsRepo.create({ contact, channel: ChannelType.WIDGET }),
    );

    await this.messagesRepo.save(
      this.messagesRepo.create({
        chat,
        chatId: chat.id,
        direction: MessageDirection.INBOUND,
        content: data.message,
        contentType: 'text',
        sentAt: new Date(),
      }),
    );

    await this.chatsRepo.update(chat.id, {
      lastMessagePreview: data.message.substring(0, 100),
      lastMessageAt: new Date(),
      unreadCount: 1,
    } as any);

    return { chatId: chat.id };
  }

  async sendVisitorMessage(chatId: string, content: string, widgetToken: string): Promise<Message> {
    await this.validateToken(widgetToken);
    const chat = await this.chatsRepo.findOne({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('Conversación no encontrada');

    const msg = await this.messagesRepo.save(
      this.messagesRepo.create({
        chat,
        chatId,
        direction: MessageDirection.INBOUND,
        content,
        contentType: 'text',
        sentAt: new Date(),
      }),
    );

    await this.chatsRepo.update(chatId, {
      lastMessagePreview: content.substring(0, 100),
      lastMessageAt: new Date(),
      unreadCount: () => 'unread_count + 1',
    } as any);

    return msg;
  }

  async getMessages(chatId: string, widgetToken: string): Promise<Message[]> {
    await this.validateToken(widgetToken);
    return this.messagesRepo.find({
      where: { chatId },
      order: { sentAt: 'ASC' },
      take: 100,
    });
  }
}
