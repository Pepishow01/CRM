import type { Request } from 'express';
import { WebhooksService } from './webhooks.service';
import { ConfigService } from '@nestjs/config';
export declare class WebhooksController {
    private webhooksService;
    private config;
    private readonly logger;
    constructor(webhooksService: WebhooksService, config: ConfigService);
    verifyWebhook(mode: string, token: string, challenge: string): string;
    receiveEvent(req: Request, signature: string, payload: any): Promise<{
        status: string;
    }>;
}
