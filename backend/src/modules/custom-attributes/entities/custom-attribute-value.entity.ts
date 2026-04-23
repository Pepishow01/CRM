import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { CustomAttributeDefinition } from './custom-attribute-definition.entity';

@Entity('custom_attribute_values')
export class CustomAttributeValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CustomAttributeDefinition, { eager: true })
  @JoinColumn({ name: 'definition_id' })
  definition: CustomAttributeDefinition;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ name: 'value_text', nullable: true })
  valueText: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
