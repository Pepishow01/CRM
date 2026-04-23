import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToMany,
} from 'typeorm';
import { Chat } from '../../chats/entities/chat.entity';

@Entity('labels')
export class Label {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ default: '#6366f1' })
  color: string;

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => Chat, (chat) => chat.labels)
  chats: Chat[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
