import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Contact } from './entities/contact.entity';
import { ContactNote } from './entities/contact-note.entity';
import { NormalizedIncomingMessage } from '../webhooks/dto/normalized-message.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private contactsRepo: Repository<Contact>,
    @InjectRepository(ContactNote)
    private notesRepo: Repository<ContactNote>,
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

  async findAll(search?: string): Promise<Contact[]> {
    if (search) {
      return this.contactsRepo.find({
        where: [
          { fullName: ILike(`%${search}%`) },
          { email: ILike(`%${search}%`) },
          { phone: ILike(`%${search}%`) },
          { whatsappPhone: ILike(`%${search}%`) },
        ],
        order: { createdAt: 'DESC' },
        take: 100,
      });
    }
    return this.contactsRepo.find({ order: { createdAt: 'DESC' }, take: 200 });
  }

  async findById(id: string): Promise<Contact> {
    const contact = await this.contactsRepo.findOne({ where: { id } });
    if (!contact) throw new NotFoundException('Contacto no encontrado');
    return contact;
  }

  async updateContact(
    id: string,
    data: { fullName?: string; email?: string; phone?: string; notesSummary?: string },
  ): Promise<Contact> {
    const contact = await this.contactsRepo.findOne({ where: { id } });
    if (!contact) throw new NotFoundException('Contacto no encontrado');
    Object.assign(contact, data);
    return this.contactsRepo.save(contact);
  }

  async removeContact(id: string): Promise<void> {
    const contact = await this.contactsRepo.findOne({ where: { id } });
    if (!contact) throw new NotFoundException('Contacto no encontrado');
    await this.contactsRepo.remove(contact);
  }

  async getNotes(contactId: string): Promise<ContactNote[]> {
    return this.notesRepo.find({
      where: { contactId },
      order: { createdAt: 'DESC' },
    });
  }

  async addNote(contactId: string, content: string, authorId?: string): Promise<ContactNote> {
    const note = this.notesRepo.create({
      contactId,
      content,
      author: authorId ? ({ id: authorId } as any) : undefined,
    });
    return this.notesRepo.save(note);
  }

  async deleteNote(noteId: string): Promise<void> {
    await this.notesRepo.delete(noteId);
  }
}