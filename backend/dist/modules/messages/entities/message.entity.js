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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = exports.MessageDirection = void 0;
const typeorm_1 = require("typeorm");
const chat_entity_1 = require("../../chats/entities/chat.entity");
const user_entity_1 = require("../../users/entities/user.entity");
var MessageDirection;
(function (MessageDirection) {
    MessageDirection["INBOUND"] = "inbound";
    MessageDirection["OUTBOUND"] = "outbound";
})(MessageDirection || (exports.MessageDirection = MessageDirection = {}));
let Message = class Message {
    id;
    chat;
    chatId;
    sender;
    senderId;
    direction;
    externalId;
    contentType;
    content;
    mediaUrl;
    metaPayload;
    isRead;
    sentAt;
    createdAt;
};
exports.Message = Message;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Message.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => chat_entity_1.Chat),
    (0, typeorm_1.JoinColumn)({ name: 'chat_id' }),
    __metadata("design:type", chat_entity_1.Chat)
], Message.prototype, "chat", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'chat_id' }),
    __metadata("design:type", String)
], Message.prototype, "chatId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'sender_id' }),
    __metadata("design:type", user_entity_1.User)
], Message.prototype, "sender", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sender_id', nullable: true }),
    __metadata("design:type", String)
], Message.prototype, "senderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: MessageDirection }),
    __metadata("design:type", String)
], Message.prototype, "direction", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'external_id', unique: true, nullable: true }),
    __metadata("design:type", String)
], Message.prototype, "externalId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'content_type', default: 'text' }),
    __metadata("design:type", String)
], Message.prototype, "contentType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Message.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'media_url', nullable: true }),
    __metadata("design:type", String)
], Message.prototype, "mediaUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'meta_payload', type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], Message.prototype, "metaPayload", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_read', default: false }),
    __metadata("design:type", Boolean)
], Message.prototype, "isRead", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sent_at' }),
    __metadata("design:type", Date)
], Message.prototype, "sentAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Message.prototype, "createdAt", void 0);
exports.Message = Message = __decorate([
    (0, typeorm_1.Entity)('messages')
], Message);
//# sourceMappingURL=message.entity.js.map