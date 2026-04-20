import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'whatsapp_phone', unique: true, nullable: true })
  whatsappPhone: string;

  @Column({ name: 'instagram_id', unique: true, nullable: true })
  instagramId: string;

  @Column({ name: 'messenger_id', unique: true, nullable: true })
  messengerId: string;

  @Column({ name: 'full_name', nullable: true })
  fullName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ name: 'travel_data', type: 'jsonb', default: {} })
  travelData: Record<string, any>;

  @Column({ name: 'notes_summary', nullable: true })
  notesSummary: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}