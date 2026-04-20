import { Chat } from '../../chats/entities/chat.entity';
import { User } from '../../users/entities/user.entity';
export declare enum MessageDirection {
    INBOUND = "inbound",
    OUTBOUND = "outbound"
}
export declare class Message {
    id: string;
    chat: Chat;
    chatId: string;
    sender: User;
    senderId: string;
    direction: MessageDirection;
    externalId: string;
    contentType: string;
    content: string;
    mediaUrl: string;
    metaPayload: Record<string, any>;
    isRead: boolean;
    sentAt: Date;
    createdAt: Date;
}
