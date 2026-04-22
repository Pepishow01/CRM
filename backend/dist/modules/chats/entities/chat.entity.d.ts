import { User } from '../../users/entities/user.entity';
import { Contact } from '../../contacts/entities/contact.entity';
export declare enum LeadStatus {
    NEW = "new",
    IN_PROGRESS = "in_progress",
    WAITING = "waiting",
    SOLD = "sold",
    LOST = "lost"
}
export declare enum ChannelType {
    WHATSAPP = "whatsapp",
    INSTAGRAM = "instagram",
    MESSENGER = "messenger"
}
export declare class Chat {
    id: string;
    contact: Contact;
    assignedTo: User;
    channel: ChannelType;
    status: LeadStatus;
    aiClassification: string;
    unreadCount: number;
    lastMessageAt: Date;
    lastMessagePreview: string;
    isBotActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
