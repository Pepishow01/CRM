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
exports.ContactsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const contact_entity_1 = require("./entities/contact.entity");
let ContactsService = class ContactsService {
    contactsRepo;
    constructor(contactsRepo) {
        this.contactsRepo = contactsRepo;
    }
    async upsertFromIncoming(msg) {
        let contact = null;
        if (msg.channel === 'whatsapp') {
            contact = await this.contactsRepo
                .createQueryBuilder('contact')
                .where('contact.whatsapp_phone = :phone', { phone: msg.senderId })
                .getOne();
        }
        else if (msg.channel === 'instagram') {
            contact = await this.contactsRepo
                .createQueryBuilder('contact')
                .where('contact.instagram_id = :id', { id: msg.senderId })
                .getOne();
        }
        else if (msg.channel === 'messenger') {
            contact = await this.contactsRepo
                .createQueryBuilder('contact')
                .where('contact.messenger_id = :id', { id: msg.senderId })
                .getOne();
        }
        if (!contact) {
            const newContact = new contact_entity_1.Contact();
            if (msg.channel === 'whatsapp')
                newContact.whatsappPhone = msg.senderId;
            if (msg.channel === 'instagram')
                newContact.instagramId = msg.senderId;
            if (msg.channel === 'messenger')
                newContact.messengerId = msg.senderId;
            newContact.fullName = (msg.senderName || null);
            contact = await this.contactsRepo.save(newContact);
        }
        else if (msg.senderName && !contact.fullName) {
            contact.fullName = msg.senderName;
            contact = await this.contactsRepo.save(contact);
        }
        return contact;
    }
    async updateTravelData(contactId, travelData) {
        await this.contactsRepo.update(contactId, { travelData });
    }
};
exports.ContactsService = ContactsService;
exports.ContactsService = ContactsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(contact_entity_1.Contact)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ContactsService);
//# sourceMappingURL=contacts.service.js.map