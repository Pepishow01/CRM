import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { WhatsAppSenderService } from './whatsapp-sender.service';
import { Message } from './entities/message.entity';
import { ChatsModule } from '../chats/chats.module';

import { WhatsAppMediaService } from './whatsapp-media.service';

import { MediaController } from './media.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message]),
    ChatsModule,
  ],
  controllers: [MessagesController, MediaController],
  providers: [MessagesService, WhatsAppSenderService, WhatsAppMediaService],
  exports: [MessagesService, WhatsAppSenderService, WhatsAppMediaService],
})
export class MessagesModule {}