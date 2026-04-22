import { ContactsService } from '../../contacts/contacts.service';
import { ChatsService } from '../../chats/chats.service';
import { MessagesService } from '../../messages/messages.service';
import { ChatGateway } from '../../chats/chat.gateway';
import { NormalizedIncomingMessage } from '../dto/normalized-message.dto';
import { AiService } from '../../ai/ai.service';
import { WhatsAppSenderService } from '../../messages/whatsapp-sender.service';
export declare class MessageProcessor {
    private contactsService;
    private chatsService;
    private messagesService;
    private chatGateway;
    private aiService;
    private whatsAppSender;
    private readonly logger;
    constructor(contactsService: ContactsService, chatsService: ChatsService, messagesService: MessagesService, chatGateway: ChatGateway, aiService: AiService, whatsAppSender: WhatsAppSenderService);
    process(msg: NormalizedIncomingMessage): Promise<void>;
}
