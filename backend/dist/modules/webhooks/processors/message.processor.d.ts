import { ContactsService } from '../../contacts/contacts.service';
import { ChatsService } from '../../chats/chats.service';
import { MessagesService } from '../../messages/messages.service';
import { NormalizedIncomingMessage } from '../dto/normalized-message.dto';
export declare class MessageProcessor {
    private contactsService;
    private chatsService;
    private messagesService;
    private readonly logger;
    constructor(contactsService: ContactsService, chatsService: ChatsService, messagesService: MessagesService);
    process(msg: NormalizedIncomingMessage): Promise<void>;
}
