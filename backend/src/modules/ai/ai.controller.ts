import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { MessagesService } from '../messages/messages.service';
import { ChatsService } from '../chats/chats.service';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chats/:chatId/ai')
export class AiController {
  constructor(
    private aiService: AiService,
    private messagesService: MessagesService,
    private chatsService: ChatsService,
  ) {}

  @Post('classify')
  async classify(@Param('chatId') chatId: string) {
    const messages = await this.messagesService.findByChatId(chatId, {
      page: 1, limit: 20,
    });
    const conversation = this.aiService.formatConversation(messages);
    return this.aiService.classifyLead(conversation);
  }

  @Post('suggest')
  async suggest(@Param('chatId') chatId: string) {
    const chat = await this.chatsService.findById(chatId);
    const messages = await this.messagesService.findByChatId(chatId, {
      page: 1, limit: 15,
    });
    const conversation = this.aiService.formatConversation(messages);
    return this.aiService.suggestReplies(
      conversation,
      chat.contact?.fullName,
    );
  }

  @Post('extract')
  async extract(@Param('chatId') chatId: string) {
    const messages = await this.messagesService.findByChatId(chatId, {
      page: 1, limit: 30,
    });
    const conversation = this.aiService.formatConversation(messages);
    return this.aiService.extractTravelData(conversation);
  }
}