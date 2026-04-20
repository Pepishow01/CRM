import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { ChatGateway } from './chat.gateway';
import { Chat } from './entities/chat.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat]),
    JwtModule.register({}),
  ],
  controllers: [ChatsController],
  providers: [ChatsService, ChatGateway],
  exports: [ChatsService, ChatGateway],
})
export class ChatsModule {}