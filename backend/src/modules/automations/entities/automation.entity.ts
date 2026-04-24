import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum AutomationTrigger {
  CONVERSATION_CREATED = 'conversation_created',
  MESSAGE_RECEIVED     = 'message_received',
  STATUS_CHANGED       = 'status_changed',
}

@Entity('automations')
export class Automation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: AutomationTrigger })
  trigger: AutomationTrigger;

  @Column({ type: 'jsonb', default: [] })
  conditions: { field: string; operator: string; value: string }[];

  @Column({ type: 'jsonb', default: [] })
  actions: { type: string; value: string }[];

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
