import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('email_inboxes')
export class EmailInbox {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'imap_host', nullable: true })
  imapHost: string;

  @Column({ name: 'imap_port', nullable: true })
  imapPort: number;

  @Column({ name: 'imap_user', nullable: true })
  imapUser: string;

  @Column({ name: 'imap_password', nullable: true })
  imapPassword: string;

  @Column({ name: 'imap_ssl', default: true })
  imapSsl: boolean;

  @Column({ name: 'smtp_host', nullable: true })
  smtpHost: string;

  @Column({ name: 'smtp_port', nullable: true })
  smtpPort: number;

  @Column({ name: 'smtp_user', nullable: true })
  smtpUser: string;

  @Column({ name: 'smtp_password', nullable: true })
  smtpPassword: string;

  @Column({ name: 'smtp_ssl', default: true })
  smtpSsl: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
