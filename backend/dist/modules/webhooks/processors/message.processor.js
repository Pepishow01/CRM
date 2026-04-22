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
var MessageProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageProcessor = void 0;
const common_1 = require("@nestjs/common");
const contacts_service_1 = require("../../contacts/contacts.service");
const chats_service_1 = require("../../chats/chats.service");
const messages_service_1 = require("../../messages/messages.service");
const chat_gateway_1 = require("../../chats/chat.gateway");
const ai_service_1 = require("../../ai/ai.service");
const whatsapp_sender_service_1 = require("../../messages/whatsapp-sender.service");
let MessageProcessor = MessageProcessor_1 = class MessageProcessor {
    contactsService;
    chatsService;
    messagesService;
    chatGateway;
    aiService;
    whatsAppSender;
    logger = new common_1.Logger(MessageProcessor_1.name);
    constructor(contactsService, chatsService, messagesService, chatGateway, aiService, whatsAppSender) {
        this.contactsService = contactsService;
        this.chatsService = chatsService;
        this.messagesService = messagesService;
        this.chatGateway = chatGateway;
        this.aiService = aiService;
        this.whatsAppSender = whatsAppSender;
    }
    async process(msg) {
        this.logger.log(`RECIBIDO: ${msg.contentType} - ID: ${msg.externalId} - MediaId: ${msg.mediaId}`);
        const existing = await this.messagesService.findByExternalId(msg.externalId);
        if (existing) {
            this.logger.log(`Mensaje ${msg.externalId} ya procesado — ignorando`);
            return;
        }
        const contact = await this.contactsService.upsertFromIncoming(msg);
        const chat = await this.chatsService.findOrCreate({
            contactId: contact.id,
            channel: msg.channel,
        });
        const message = await this.messagesService.create({
            chatId: chat.id,
            direction: 'inbound',
            channel: msg.channel,
            externalId: msg.externalId,
            contentType: msg.contentType,
            content: msg.text,
            mediaUrl: msg.mediaId ? `/media/${msg.mediaId}` : undefined,
            metaPayload: msg.rawPayload,
            sentAt: msg.timestamp,
        });
        await this.chatsService.updateLastMessage(chat.id, {
            preview: msg.text?.substring(0, 100) ?? '[Media]',
            timestamp: msg.timestamp,
        });
        await this.chatGateway.emitNewMessage({
            chatId: chat.id,
            message,
            contact,
            assignedTo: chat.assignedTo?.id ?? null,
        });
        this.logger.log(`Mensaje ${msg.externalId} guardado y emitido por WebSocket`);
        if (chat.isBotActive && msg.contentType === 'text') {
            try {
                this.logger.log(`Bot activo para chat ${chat.id}. Generando respuesta...`);
                const history = await this.messagesService.findByChatId(chat.id, { page: 1, limit: 10 });
                const conversation = this.aiService.formatConversation(history.reverse());
                const reply = await this.aiService.generateAutoReply(conversation, contact.fullName);
                if (reply) {
                    this.logger.log(`Enviando auto-respuesta a ${contact.whatsappPhone}: ${reply}`);
                    const externalId = await this.whatsAppSender.sendText(contact.whatsappPhone, reply);
                    const botMessage = await this.messagesService.create({
                        chatId: chat.id,
                        direction: 'outbound',
                        channel: chat.channel,
                        externalId,
                        contentType: 'text',
                        content: reply,
                        sentAt: new Date(),
                    });
                    await this.chatsService.updateLastMessage(chat.id, {
                        preview: reply.substring(0, 100),
                        timestamp: new Date(),
                    });
                    await this.chatGateway.emitNewMessage({
                        chatId: chat.id,
                        message: botMessage,
                        contact,
                        assignedTo: chat.assignedTo?.id ?? null,
                    });
                }
            }
            catch (err) {
                this.logger.error(`Error en el Bot Auto-Respuesta: ${err.message}`);
            }
        }
    }
};
exports.MessageProcessor = MessageProcessor;
exports.MessageProcessor = MessageProcessor = MessageProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [contacts_service_1.ContactsService,
        chats_service_1.ChatsService,
        messages_service_1.MessagesService,
        chat_gateway_1.ChatGateway,
        ai_service_1.AiService,
        whatsapp_sender_service_1.WhatsAppSenderService])
], MessageProcessor);
//# sourceMappingURL=message.processor.js.map