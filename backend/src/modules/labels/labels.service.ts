import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Label } from './entities/label.entity';
import { Chat } from '../chats/entities/chat.entity';
import { CreateLabelDto } from './dto/create-label.dto';

@Injectable()
export class LabelsService {
  constructor(
    @InjectRepository(Label) private labelsRepo: Repository<Label>,
    @InjectRepository(Chat) private chatsRepo: Repository<Chat>,
  ) {}

  async findAll(): Promise<Label[]> {
    return this.labelsRepo.find({ order: { name: 'ASC' } });
  }

  async create(dto: CreateLabelDto): Promise<Label> {
    const existing = await this.labelsRepo.findOne({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Ya existe una etiqueta con ese nombre');
    const label = this.labelsRepo.create(dto);
    return this.labelsRepo.save(label);
  }

  async update(id: string, dto: Partial<CreateLabelDto>): Promise<Label> {
    const label = await this.labelsRepo.findOne({ where: { id } });
    if (!label) throw new NotFoundException('Etiqueta no encontrada');
    Object.assign(label, dto);
    return this.labelsRepo.save(label);
  }

  async remove(id: string): Promise<void> {
    const label = await this.labelsRepo.findOne({ where: { id } });
    if (!label) throw new NotFoundException('Etiqueta no encontrada');
    await this.labelsRepo.remove(label);
  }

  async addToChat(chatId: string, labelId: string): Promise<Chat> {
    const chat = await this.chatsRepo.findOne({
      where: { id: chatId },
      relations: ['labels', 'contact', 'assignedTo'],
    });
    if (!chat) throw new NotFoundException('Chat no encontrado');
    const label = await this.labelsRepo.findOne({ where: { id: labelId } });
    if (!label) throw new NotFoundException('Etiqueta no encontrada');
    if (!chat.labels) chat.labels = [];
    if (!chat.labels.find((l) => l.id === labelId)) {
      chat.labels.push(label);
      await this.chatsRepo.save(chat);
    }
    return chat;
  }

  async removeFromChat(chatId: string, labelId: string): Promise<Chat> {
    const chat = await this.chatsRepo.findOne({
      where: { id: chatId },
      relations: ['labels', 'contact', 'assignedTo'],
    });
    if (!chat) throw new NotFoundException('Chat no encontrado');
    chat.labels = (chat.labels ?? []).filter((l) => l.id !== labelId);
    await this.chatsRepo.save(chat);
    return chat;
  }

  async getChatLabels(chatId: string): Promise<Label[]> {
    const chat = await this.chatsRepo.findOne({
      where: { id: chatId },
      relations: ['labels'],
    });
    if (!chat) throw new NotFoundException('Chat no encontrado');
    return chat.labels ?? [];
  }
}
