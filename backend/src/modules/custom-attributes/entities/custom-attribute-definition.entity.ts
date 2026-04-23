import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum AttributeEntityType {
  CONTACT = 'contact',
  CHAT = 'chat',
}

export enum AttributeValueType {
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  LIST = 'list',
}

@Entity('custom_attribute_definitions')
export class CustomAttributeDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ type: 'enum', enum: AttributeEntityType })
  entityType: AttributeEntityType;

  @Column({ type: 'enum', enum: AttributeValueType, default: AttributeValueType.TEXT })
  valueType: AttributeValueType;

  @Column({ type: 'jsonb', nullable: true })
  listOptions: string[];

  @Column({ default: false })
  required: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
