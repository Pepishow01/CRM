import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Macro } from './entities/macro.entity';
import { CreateMacroDto } from './dto/create-macro.dto';
import { ChatsService } from '../chats/chats.service';
import { LabelsService } from '../labels/labels.service';

@Injectable()
export class MacrosService {
  constructor(
    @InjectRepository(Macro)
    private macrosRepo: Repository<Macro>,
    private chatsService: ChatsService,
    private labelsService: LabelsService,
  ) {}

  findAll(): Promise<Macro[]> {
    return this.macrosRepo.find({ order: { createdAt: 'ASC' } });
  }

  findById(id: string): Promise<Macro | null> {
    return this.macrosRepo.findOne({ where: { id } });
  }

  async create(dto: CreateMacroDto, userId?: string): Promise<Macro> {
    const macro = this.macrosRepo.create({
      name: dto.name,
      description: dto.description,
      actions: dto.actions as any,
      createdBy: userId ? ({ id: userId } as any) : undefined,
    });
    return this.macrosRepo.save(macro);
  }

  async update(id: string, dto: Partial<CreateMacroDto>): Promise<Macro> {
    const macro = await this.findById(id);
    if (!macro) throw new NotFoundException('Macro no encontrada');
    Object.assign(macro, dto);
    return this.macrosRepo.save(macro);
  }

  async remove(id: string): Promise<void> {
    await this.macrosRepo.delete(id);
  }

  async execute(macroId: string, chatId: string): Promise<{ applied: string[] }> {
    const macro = await this.findById(macroId);
    if (!macro) throw new NotFoundException('Macro no encontrada');

    const applied: string[] = [];

    for (const action of macro.actions) {
      try {
        switch (action.type) {
          case 'assign_agent':
            await this.chatsService.assignTo(chatId, action.value || null);
            applied.push(`Agente asignado`);
            break;
          case 'assign_team':
            await this.chatsService.assignTeam(chatId, action.value || null);
            applied.push(`Equipo asignado`);
            break;
          case 'change_status':
            await this.chatsService.updateStatus(chatId, action.value);
            applied.push(`Estado cambiado a ${action.value}`);
            break;
          case 'set_priority':
            await this.chatsService.setPriority(chatId, action.value);
            applied.push(`Prioridad cambiada a ${action.value}`);
            break;
          case 'add_label':
            await this.labelsService.addToChat(chatId, action.value);
            applied.push(`Etiqueta agregada`);
            break;
          case 'remove_label':
            await this.labelsService.removeFromChat(chatId, action.value);
            applied.push(`Etiqueta removida`);
            break;
        }
      } catch (e) {
        // continue with next action
      }
    }

    return { applied };
  }
}
