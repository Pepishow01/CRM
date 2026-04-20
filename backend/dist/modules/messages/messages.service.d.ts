import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
export declare class MessagesService {
    private messagesRepo;
    constructor(messagesRepo: Repository<Message>);
    create(data: {
        chatId: string;
        direction: 'inbound' | 'outbound';
        channel: string;
        externalId?: string;
        contentType: string;
        content?: string;
        mediaUrl?: string;
        metaPayload?: Record<string, any>;
        sentAt: Date;
    }): Promise<Message>;
    findByExternalId(externalId: string): Promise<Message | null>;
    findByChatId(chatId: string, options: {
        page: number;
        limit: number;
    }): Promise<Message[]>;
}
