import { NormalizedIncomingMessage, ContentType } from '../dto/normalized-message.dto';

export function parseWhatsAppPayload(payload: any): NormalizedIncomingMessage[] {
  const messages: NormalizedIncomingMessage[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'messages') continue;

      const value = change.value;
      const contactsMap = new Map(
        (value.contacts ?? []).map((c: any) => [c.wa_id, c.profile?.name]),
      );

      for (const msg of value.messages ?? []) {
        if (!msg.from) continue;

        const contentType = mapWhatsAppType(msg.type);

        messages.push({
          channel: 'whatsapp',
          externalId: msg.id,
          senderId: msg.from,
          senderName: String(contactsMap.get(msg.from) ?? ''),
          recipientId: value.metadata?.phone_number_id,
          contentType,
          text: msg.text?.body ?? msg.caption,
          mediaId: msg.image?.id ?? msg.audio?.id ?? msg.video?.id ?? msg.document?.id,
          timestamp: new Date(parseInt(msg.timestamp, 10) * 1000),
          rawPayload: msg,
        });
      }
    }
  }

  return messages;
}

function mapWhatsAppType(type: string): ContentType {
  const map: Record<string, ContentType> = {
    text: 'text',
    image: 'image',
    audio: 'audio',
    video: 'video',
    document: 'document',
    sticker: 'sticker',
    location: 'location',
  };
  return map[type] ?? 'unsupported';
}