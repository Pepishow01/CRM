import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Automation, AutomationTrigger } from './entities/automation.entity';
import { ChatsService } from '../chats/chats.service';
import { MessagesService } from '../messages/messages.service';
import { WhatsAppSenderService } from '../messages/whatsapp-sender.service';

@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);

  constructor(
    @InjectRepository(Automation)
    private automationsRepo: Repository<Automation>,
    private chatsService: ChatsService,
    private messagesService: MessagesService,
    private whatsAppSender: WhatsAppSenderService,
  ) {}

  findAll(): Promise<Automation[]> {
    return this.automationsRepo.find({ order: { createdAt: 'DESC' } });
  }

  create(data: Partial<Automation>): Promise<Automation> {
    return this.automationsRepo.save(this.automationsRepo.create(data));
  }

  async update(id: string, data: Partial<Automation>): Promise<Automation> {
    await this.automationsRepo.update(id, data);
    return this.automationsRepo.findOne({ where: { id } }) as Promise<Automation>;
  }

  async remove(id: string): Promise<void> {
    await this.automationsRepo.delete(id);
  }

  async execute(trigger: AutomationTrigger, context: { chat: any; message?: any }): Promise<void> {
    const rules = await this.automationsRepo.find({ where: { trigger, enabled: true } });
    for (const rule of rules) {
      if (this.matchesConditions(rule.conditions, context)) {
        await this.runActions(rule.actions, context);
      }
    }
  }

  private matchesConditions(conditions: any[], context: { chat: any; message?: any }): boolean {
    if (!conditions || conditions.length === 0) return true;
    return conditions.every((cond) => {
      const val = this.resolveField(cond.field, context);
      switch (cond.operator) {
        case 'equals':    return val === cond.value;
        case 'not_equals': return val !== cond.value;
        case 'contains':  return String(val ?? '').toLowerCase().includes(cond.value.toLowerCase());
        default: return true;
      }
    });
  }

  private resolveField(field: string, context: { chat: any; message?: any }): string | undefined {
    switch (field) {
      case 'channel':  return context.chat?.channel;
      case 'status':   return context.chat?.status;
      case 'conv_status': return context.chat?.convStatus;
      case 'priority': return context.chat?.priority;
      case 'assigned_to': return context.chat?.assignedTo?.id ?? 'none';
      case 'message_content': return context.message?.content;
      default: return undefined;
    }
  }

  private async runActions(actions: any[], context: { chat: any; message?: any }): Promise<void> {
    const chatId = context.chat?.id;
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'assign_agent':
            await this.chatsService.assignTo(chatId, action.value || null);
            await this.chatsService.createActivity(chatId, `Automatización: Conversación asignada`);
            break;
          case 'assign_team':
            await this.chatsService.assignTeam(chatId, action.value || null);
            await this.chatsService.createActivity(chatId, `Automatización: Equipo asignado`);
            break;
          case 'resolve':
            await this.chatsService.setConvStatus(chatId, 'resolved' as any);
            await this.chatsService.createActivity(chatId, `Automatización: Conversación resuelta`);
            break;
          case 'send_message':
            if (action.value && context.chat?.channel === 'whatsapp' && context.chat?.contact?.whatsappPhone) {
              let phone = context.chat.contact.whatsappPhone.startsWith('+')
                ? context.chat.contact.whatsappPhone.slice(1)
                : context.chat.contact.whatsappPhone;
              if (phone.startsWith('549')) phone = '54' + phone.slice(3);
              await this.whatsAppSender.sendText(phone, action.value);
              await this.messagesService.create({
                chatId,
                direction: 'outbound',
                channel: context.chat.channel,
                contentType: 'text',
                content: action.value,
                sentAt: new Date(),
              });
            }
            break;
          case 'add_label':
            await this.chatsService.createActivity(chatId, `Automatización: Etiqueta "${action.value}" aplicada`);
            break;
        }
        this.logger.log(`Automatización ejecutó acción ${action.type} en chat ${chatId}`);
      } catch (err) {
        this.logger.error(`Error en acción ${action.type}: ${err.message}`);
      }
    }
  }
}
