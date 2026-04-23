import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WidgetConfig } from './entities/widget-config.entity';
import { Chat } from '../chats/entities/chat.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { Message } from '../messages/entities/message.entity';
import { WidgetService } from './widget.service';
import { WidgetController } from './widget.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WidgetConfig, Chat, Contact, Message])],
  providers: [WidgetService],
  controllers: [WidgetController],
  exports: [WidgetService],
})
export class WidgetModule {}
