import { Repository } from 'typeorm';
import { Contact } from './entities/contact.entity';
import { NormalizedIncomingMessage } from '../webhooks/dto/normalized-message.dto';
export declare class ContactsService {
    private contactsRepo;
    constructor(contactsRepo: Repository<Contact>);
    upsertFromIncoming(msg: NormalizedIncomingMessage): Promise<Contact>;
    updateTravelData(contactId: string, travelData: Record<string, any>): Promise<void>;
}
