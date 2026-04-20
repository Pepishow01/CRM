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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const chat_entity_1 = require("./entities/chat.entity");
let ChatsService = class ChatsService {
    chatsRepo;
    constructor(chatsRepo) {
        this.chatsRepo = chatsRepo;
    }
    async findOrCreate(data) {
        let chat = await this.chatsRepo
            .createQueryBuilder('chat')
            .leftJoinAndSelect('chat.contact', 'contact')
            .leftJoinAndSelect('chat.assignedTo', 'assignedTo')
            .where('contact.id = :contactId', { contactId: data.contactId })
            .andWhere('chat.channel = :channel', { channel: data.channel })
            .getOne();
        if (!chat) {
            const newChat = new chat_entity_1.Chat();
            newChat.contact = { id: data.contactId };
            newChat.channel = data.channel;
            const saved = await this.chatsRepo.save(newChat);
            chat = await this.chatsRepo
                .createQueryBuilder('chat')
                .leftJoinAndSelect('chat.contact', 'contact')
                .leftJoinAndSelect('chat.assignedTo', 'assignedTo')
                .where('chat.id = :id', { id: saved.id })
                .getOne();
        }
        return chat;
    }
    async findById(id) {
        return this.chatsRepo
            .createQueryBuilder('chat')
            .leftJoinAndSelect('chat.contact', 'contact')
            .leftJoinAndSelect('chat.assignedTo', 'assignedTo')
            .where('chat.id = :id', { id })
            .getOne();
    }
    async updateLastMessage(chatId, data) {
        await this.chatsRepo.update(chatId, {
            lastMessagePreview: data.preview,
            lastMessageAt: data.timestamp,
            unreadCount: () => 'unread_count + 1',
        });
    }
    async findAll(userId) {
        const query = this.chatsRepo
            .createQueryBuilder('chat')
            .leftJoinAndSelect('chat.contact', 'contact')
            .leftJoinAndSelect('chat.assignedTo', 'assignedTo')
            .orderBy('chat.lastMessageAt', 'DESC');
        if (userId) {
            query.where('chat.assignedTo = :userId', { userId });
        }
        return query.getMany();
    }
    async updateStatus(chatId, status) {
        await this.chatsRepo.update(chatId, { status: status });
    }
};
exports.ChatsService = ChatsService;
exports.ChatsService = ChatsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(chat_entity_1.Chat)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ChatsService);
//# sourceMappingURL=chats.service.js.map