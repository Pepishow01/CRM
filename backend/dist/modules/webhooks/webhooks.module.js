"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksModule = void 0;
const common_1 = require("@nestjs/common");
const webhooks_controller_1 = require("./webhooks.controller");
const webhooks_service_1 = require("./webhooks.service");
const message_processor_1 = require("./processors/message.processor");
const contacts_module_1 = require("../contacts/contacts.module");
const chats_module_1 = require("../chats/chats.module");
const messages_module_1 = require("../messages/messages.module");
let WebhooksModule = class WebhooksModule {
};
exports.WebhooksModule = WebhooksModule;
exports.WebhooksModule = WebhooksModule = __decorate([
    (0, common_1.Module)({
        imports: [contacts_module_1.ContactsModule, chats_module_1.ChatsModule, messages_module_1.MessagesModule],
        controllers: [webhooks_controller_1.WebhooksController],
        providers: [webhooks_service_1.WebhooksService, message_processor_1.MessageProcessor],
        exports: [webhooks_service_1.WebhooksService],
    })
], WebhooksModule);
//# sourceMappingURL=webhooks.module.js.map