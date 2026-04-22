import {
  Controller, Get, Post, Query, Body,
  Headers, Req, HttpCode, HttpStatus,
  BadRequestException, Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private webhooksService: WebhooksService,
    private config: ConfigService,
  ) {}

  @Get('meta')
  @ApiOperation({ summary: 'Verificación de webhook Meta' })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): string {
    const verifyToken = this.config.get<string>('META_WEBHOOK_VERIFY_TOKEN');

    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('Webhook de Meta verificado exitosamente');
      return challenge;
    }

    throw new BadRequestException('Token de verificación inválido');
  }

  @Post('meta')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recepción de eventos Meta' })
  async receiveEvent(
    @Req() req: Request,
    @Headers('x-hub-signature-256') signature: string,
    @Body() payload: any,
  ): Promise<{ status: string }> {
    const appSecret = this.config.get<string>('META_APP_SECRET');

    if (appSecret && appSecret !== 'completar_despues' && signature) {
      const rawBody = req['rawBody'] || JSON.stringify(payload);
      const expectedSig = 'sha256=' + crypto
        .createHmac('sha256', appSecret)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSig) {
        this.logger.warn(`Firma inválida. Recibida: ${signature}. Esperada: ${expectedSig}`);
        throw new BadRequestException('Firma inválida');
      }
    }

    await this.webhooksService.enqueueMetaEvent(payload);
    return { status: 'ok' };
  }
}