import { MessageProcessor } from './processors/message.processor';
export declare class WebhooksService {
    private messageProcessor;
    private readonly logger;
    constructor(messageProcessor: MessageProcessor);
    enqueueMetaEvent(payload: any): Promise<void>;
}
