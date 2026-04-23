import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailInbox } from './entities/email-inbox.entity';
import { Chat, ChannelType } from '../chats/entities/chat.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { Message, MessageDirection } from '../messages/entities/message.entity';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectRepository(EmailInbox) private inboxRepo: Repository<EmailInbox>,
    @InjectRepository(Chat) private chatsRepo: Repository<Chat>,
    @InjectRepository(Contact) private contactsRepo: Repository<Contact>,
    @InjectRepository(Message) private messagesRepo: Repository<Message>,
  ) {}

  async findAllInboxes(): Promise<EmailInbox[]> {
    return this.inboxRepo.find();
  }

  async createInbox(data: Partial<EmailInbox>): Promise<EmailInbox> {
    const inbox = this.inboxRepo.create(data);
    return this.inboxRepo.save(inbox);
  }

  async updateInbox(id: string, data: Partial<EmailInbox>): Promise<EmailInbox> {
    const inbox = await this.inboxRepo.findOne({ where: { id } });
    if (!inbox) throw new NotFoundException('Bandeja de email no encontrada');
    Object.assign(inbox, data);
    return this.inboxRepo.save(inbox);
  }

  async removeInbox(id: string): Promise<void> {
    const inbox = await this.inboxRepo.findOne({ where: { id } });
    if (!inbox) throw new NotFoundException('Bandeja de email no encontrada');
    await this.inboxRepo.remove(inbox);
  }

  async sendEmail(chatId: string, subject: string, htmlContent: string, userId: string): Promise<Message> {
    const chat = await this.chatsRepo.findOne({
      where: { id: chatId },
      relations: ['contact'],
    });
    if (!chat) throw new NotFoundException('Chat no encontrado');
    if (chat.channel !== ChannelType.EMAIL) {
      throw new Error('El chat no es de tipo email');
    }

    const inbox = await this.inboxRepo.findOne({ where: { isActive: true } });
    if (!inbox) throw new NotFoundException('No hay bandeja de email configurada');

    const contactEmail = chat.contact.email;
    if (!contactEmail) throw new Error('El contacto no tiene email');

    const transporter = nodemailer.createTransport({
      host: inbox.smtpHost,
      port: inbox.smtpPort,
      secure: inbox.smtpSsl,
      auth: { user: inbox.smtpUser, pass: inbox.smtpPassword },
    });

    await transporter.sendMail({
      from: `"${inbox.name}" <${inbox.email}>`,
      to: contactEmail,
      subject,
      html: htmlContent,
    });

    const msg = this.messagesRepo.create({
      chat: { id: chatId } as any,
      chatId,
      sender: { id: userId } as any,
      senderId: userId,
      direction: MessageDirection.OUTBOUND,
      contentType: 'email',
      content: htmlContent,
      metaPayload: { subject },
      sentAt: new Date(),
    });

    return this.messagesRepo.save(msg);
  }

  async receiveEmail(data: {
    from: string;
    fromName?: string;
    subject: string;
    text?: string;
    html?: string;
    messageId: string;
    inboxId: string;
  }): Promise<void> {
    let contact = await this.contactsRepo.findOne({ where: { email: data.from } });

    if (!contact) {
      contact = this.contactsRepo.create({
        email: data.from,
        fullName: data.fromName ?? data.from,
      });
      contact = await this.contactsRepo.save(contact);
    }

    let chat = await this.chatsRepo
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.contact', 'contact')
      .where('contact.id = :contactId', { contactId: contact.id })
      .andWhere('chat.channel = :channel', { channel: ChannelType.EMAIL })
      .getOne();

    if (!chat) {
      chat = this.chatsRepo.create({
        contact,
        channel: ChannelType.EMAIL,
      });
      chat = await this.chatsRepo.save(chat);
    }

    const existing = await this.messagesRepo.findOne({ where: { externalId: data.messageId } });
    if (existing) return;

    const content = data.text ?? data.html ?? '';
    await this.messagesRepo.save(
      this.messagesRepo.create({
        chat,
        chatId: chat.id,
        direction: MessageDirection.INBOUND,
        contentType: 'email',
        content,
        externalId: data.messageId,
        metaPayload: { subject: data.subject, html: data.html },
        sentAt: new Date(),
      }),
    );

    await this.chatsRepo.update(chat.id, {
      lastMessagePreview: data.subject,
      lastMessageAt: new Date(),
      unreadCount: () => 'unread_count + 1',
    } as any);
  }
}
