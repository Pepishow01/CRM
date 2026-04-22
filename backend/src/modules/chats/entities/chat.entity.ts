import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Contact } from '../../contacts/entities/contact.entity';

export enum LeadStatus {
  NEW         = 'new',
  IN_PROGRESS = 'in_progress',
  WAITING     = 'waiting',
  SOLD        = 'sold',
  LOST        = 'lost',
}

export enum ChannelType {
  WHATSAPP  = 'whatsapp',
  INSTAGRAM = 'instagram',
  MESSENGER = 'messenger',
}

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Contact, { eager: true })
  @JoinColumn({ name: 'contact_id' })
  contact: Contact;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to' })
  assignedTo: User;

  @Column({ type: 'enum', enum: ChannelType })
  channel: ChannelType;

  @Column({ type: 'enum', enum: LeadStatus, default: LeadStatus.NEW })
  status: LeadStatus;

  @Column({ name: 'ai_classification', nullable: true })
  aiClassification: string;

  @Column({ name: 'unread_count', default: 0 })
  unreadCount: number;

  @Column({ name: 'last_message_at', nullable: true })
  lastMessageAt: Date;

  @Column({ name: 'last_message_preview', nullable: true })
  lastMessagePreview: string;

  @Column({ name: 'is_bot_active', default: false })
  isBotActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}