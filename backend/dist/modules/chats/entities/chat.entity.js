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
exports.Chat = exports.ChannelType = exports.LeadStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const contact_entity_1 = require("../../contacts/entities/contact.entity");
var LeadStatus;
(function (LeadStatus) {
    LeadStatus["NEW"] = "new";
    LeadStatus["IN_PROGRESS"] = "in_progress";
    LeadStatus["WAITING"] = "waiting";
    LeadStatus["SOLD"] = "sold";
    LeadStatus["LOST"] = "lost";
})(LeadStatus || (exports.LeadStatus = LeadStatus = {}));
var ChannelType;
(function (ChannelType) {
    ChannelType["WHATSAPP"] = "whatsapp";
    ChannelType["INSTAGRAM"] = "instagram";
    ChannelType["MESSENGER"] = "messenger";
})(ChannelType || (exports.ChannelType = ChannelType = {}));
let Chat = class Chat {
    id;
    contact;
    assignedTo;
    channel;
    status;
    aiClassification;
    unreadCount;
    lastMessageAt;
    lastMessagePreview;
    createdAt;
    updatedAt;
};
exports.Chat = Chat;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Chat.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => contact_entity_1.Contact, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'contact_id' }),
    __metadata("design:type", contact_entity_1.Contact)
], Chat.prototype, "contact", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'assigned_to' }),
    __metadata("design:type", user_entity_1.User)
], Chat.prototype, "assignedTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ChannelType }),
    __metadata("design:type", String)
], Chat.prototype, "channel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: LeadStatus, default: LeadStatus.NEW }),
    __metadata("design:type", String)
], Chat.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ai_classification', nullable: true }),
    __metadata("design:type", String)
], Chat.prototype, "aiClassification", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unread_count', default: 0 }),
    __metadata("design:type", Number)
], Chat.prototype, "unreadCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_message_at', nullable: true }),
    __metadata("design:type", Date)
], Chat.prototype, "lastMessageAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_message_preview', nullable: true }),
    __metadata("design:type", String)
], Chat.prototype, "lastMessagePreview", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Chat.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Chat.prototype, "updatedAt", void 0);
exports.Chat = Chat = __decorate([
    (0, typeorm_1.Entity)('chats')
], Chat);
//# sourceMappingURL=chat.entity.js.map