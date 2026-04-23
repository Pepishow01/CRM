import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailInbox } from './entities/email-inbox.entity';
import { Chat } from '../chats/entities/chat.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { Message } from '../messages/entities/message.entity';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EmailInbox, Chat, Contact, Message])],
  providers: [EmailService],
  controllers: [EmailController],
  exports: [EmailService],
})
export class EmailModule {}
