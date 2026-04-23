import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('macros')
export class Macro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  // Array of actions: [{ type: 'assign_agent', value: 'userId' }, { type: 'add_label', value: 'labelId' }, ...]
  @Column({ type: 'jsonb', default: '[]' })
  actions: MacroAction[];

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

export interface MacroAction {
  type: 'assign_agent' | 'assign_team' | 'add_label' | 'remove_label' | 'change_status' | 'send_message' | 'set_priority';
  value: string;
}
