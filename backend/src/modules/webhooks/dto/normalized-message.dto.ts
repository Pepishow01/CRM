export type IncomingChannel = 'whatsapp' | 'instagram' | 'messenger';
export type ContentType = 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'location' | 'unsupported';

export interface NormalizedIncomingMessage {
  channel: IncomingChannel;
  externalId: string;
  senderId: string;
  senderName?: string | undefined;
  recipientId: string;
  contentType: ContentType;
  text?: string;
  mediaId?: string;
  mediaUrl?: string;
  timestamp: Date;
  rawPayload: Record<string, any>;
}