import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { MessageProcessor } from './processors/message.processor';
import { ContactsModule } from '../contacts/contacts.module';
import { ChatsModule } from '../chats/chats.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [ContactsModule, ChatsModule, MessagesModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, MessageProcessor],
  exports: [WebhooksService],
})
export class WebhooksModule {}