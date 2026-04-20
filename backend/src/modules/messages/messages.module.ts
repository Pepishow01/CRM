import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { WhatsAppSenderService } from './whatsapp-sender.service';
import { Message } from './entities/message.entity';
import { ChatsModule } from '../chats/chats.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message]),
    ChatsModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService, WhatsAppSenderService],
  exports: [MessagesService, WhatsAppSenderService],
})
export class MessagesModule {}