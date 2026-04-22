import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { MessagesModule } from '../messages/messages.module';
import { ChatsModule } from '../chats/chats.module';

import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [MessagesModule, ChatsModule, SettingsModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}