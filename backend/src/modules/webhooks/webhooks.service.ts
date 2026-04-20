import { Injectable, Logger } from '@nestjs/common';
import { parseWhatsAppPayload } from './parsers/whatsapp.parser';
import { NormalizedIncomingMessage } from './dto/normalized-message.dto';
import { MessageProcessor } from './processors/message.processor';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private messageProcessor: MessageProcessor) {}

  async enqueueMetaEvent(payload: any): Promise<void> {
    const object = payload.object;
    let normalizedMessages: NormalizedIncomingMessage[] = [];

    if (object === 'whatsapp_business_account') {
      normalizedMessages = parseWhatsAppPayload(payload);
    } else {
      this.logger.warn(`Tipo de evento desconocido: ${object}`);
      return;
    }

    for (const msg of normalizedMessages) {
      await this.messageProcessor.process(msg);
    }

    this.logger.log(
      `${normalizedMessages.length} mensajes procesados de ${object}`,
    );
  }
}