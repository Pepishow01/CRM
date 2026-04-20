"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WebhooksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_parser_1 = require("./parsers/whatsapp.parser");
const message_processor_1 = require("./processors/message.processor");
let WebhooksService = WebhooksService_1 = class WebhooksService {
    messageProcessor;
    logger = new common_1.Logger(WebhooksService_1.name);
    constructor(messageProcessor) {
        this.messageProcessor = messageProcessor;
    }
    async enqueueMetaEvent(payload) {
        const object = payload.object;
        let normalizedMessages = [];
        if (object === 'whatsapp_business_account') {
            normalizedMessages = (0, whatsapp_parser_1.parseWhatsAppPayload)(payload);
        }
        else {
            this.logger.warn(`Tipo de evento desconocido: ${object}`);
            return;
        }
        for (const msg of normalizedMessages) {
            await this.messageProcessor.process(msg);
        }
        this.logger.log(`${normalizedMessages.length} mensajes procesados de ${object}`);
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = WebhooksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [message_processor_1.MessageProcessor])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map