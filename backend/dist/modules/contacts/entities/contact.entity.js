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
exports.Contact = void 0;
const typeorm_1 = require("typeorm");
let Contact = class Contact {
    id;
    whatsappPhone;
    instagramId;
    messengerId;
    fullName;
    email;
    phone;
    avatarUrl;
    travelData;
    notesSummary;
    createdAt;
    updatedAt;
};
exports.Contact = Contact;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Contact.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'whatsapp_phone', unique: true, nullable: true }),
    __metadata("design:type", String)
], Contact.prototype, "whatsappPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'instagram_id', unique: true, nullable: true }),
    __metadata("design:type", String)
], Contact.prototype, "instagramId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'messenger_id', unique: true, nullable: true }),
    __metadata("design:type", String)
], Contact.prototype, "messengerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'full_name', nullable: true }),
    __metadata("design:type", String)
], Contact.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Contact.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Contact.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avatar_url', nullable: true }),
    __metadata("design:type", String)
], Contact.prototype, "avatarUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'travel_data', type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], Contact.prototype, "travelData", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notes_summary', nullable: true }),
    __metadata("design:type", String)
], Contact.prototype, "notesSummary", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Contact.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Contact.prototype, "updatedAt", void 0);
exports.Contact = Contact = __decorate([
    (0, typeorm_1.Entity)('contacts')
], Contact);
//# sourceMappingURL=contact.entity.js.map