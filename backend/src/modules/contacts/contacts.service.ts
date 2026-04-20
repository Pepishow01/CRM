import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './entities/contact.entity';
import { NormalizedIncomingMessage } from '../webhooks/dto/normalized-message.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private contactsRepo: Repository<Contact>,
  ) {}

  async upsertFromIncoming(msg: NormalizedIncomingMessage): Promise<Contact> {
    let contact: Contact | null = null;

    if (msg.channel === 'whatsapp') {
      contact = await this.contactsRepo
        .createQueryBuilder('contact')
        .where('contact.whatsapp_phone = :phone', { phone: msg.senderId })
        .getOne();
    } else if (msg.channel === 'instagram') {
      contact = await this.contactsRepo
        .createQueryBuilder('contact')
        .where('contact.instagram_id = :id', { id: msg.senderId })
        .getOne();
    } else if (msg.channel === 'messenger') {
      contact = await this.contactsRepo
        .createQueryBuilder('contact')
        .where('contact.messenger_id = :id', { id: msg.senderId })
        .getOne();
    }

    if (!contact) {
      const newContact = new Contact();
      if (msg.channel === 'whatsapp') newContact.whatsappPhone = msg.senderId;
      if (msg.channel === 'instagram') newContact.instagramId = msg.senderId;
      if (msg.channel === 'messenger') newContact.messengerId = msg.senderId;
      newContact.fullName = (msg.senderName || null) as any;
      contact = await this.contactsRepo.save(newContact);
    } else if (msg.senderName && !contact.fullName) {
      contact.fullName = msg.senderName;
      contact = await this.contactsRepo.save(contact);
    }

    return contact;
  }

  async updateTravelData(
    contactId: string,
    travelData: Record<string, any>,
  ): Promise<void> {
    await this.contactsRepo.update(contactId, { travelData });
  }
}