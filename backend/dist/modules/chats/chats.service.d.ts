import { Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';
export declare class ChatsService {
    private chatsRepo;
    constructor(chatsRepo: Repository<Chat>);
    findOrCreate(data: {
        contactId: string;
        channel: string;
    }): Promise<Chat>;
    findById(id: string): Promise<Chat>;
    updateLastMessage(chatId: string, data: {
        preview: string;
        timestamp: Date;
    }): Promise<void>;
    findAll(userId?: string): Promise<Chat[]>;
    updateStatus(chatId: string, status: string): Promise<void>;
    toggleBot(chatId: string, active: boolean): Promise<void>;
}
