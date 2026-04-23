import {
  Controller, Get, Post, Body, Param,
  UseGuards, Headers,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WidgetService } from './widget.service';

@ApiTags('Widget')
@Controller('widget')
export class WidgetController {
  constructor(private widgetService: WidgetService) {}

  // Public: get widget config by token
  @Get('config/:token')
  getConfig(@Param('token') token: string) {
    return this.widgetService.getConfig(token);
  }

  // Public: visitor starts a conversation
  @Post('conversations')
  createConversation(@Body() body: {
    widgetToken: string;
    visitorName: string;
    visitorEmail?: string;
    message: string;
  }) {
    return this.widgetService.createConversation(body);
  }

  // Public: visitor sends a message
  @Post('conversations/:chatId/messages')
  sendMessage(
    @Param('chatId') chatId: string,
    @Body() body: { widgetToken: string; content: string },
  ) {
    return this.widgetService.sendVisitorMessage(chatId, body.content, body.widgetToken);
  }

  // Public: get conversation messages (for widget)
  @Get('conversations/:chatId/messages')
  getMessages(
    @Param('chatId') chatId: string,
    @Headers('x-widget-token') token: string,
  ) {
    return this.widgetService.getMessages(chatId, token);
  }

  // Protected: manage widget configs
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('configs')
  listConfigs() {
    return this.widgetService.listConfigs();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('configs')
  createConfig(@Body() body: { name: string; welcomeMessage?: string; color?: string }) {
    return this.widgetService.createConfig(body);
  }
}
