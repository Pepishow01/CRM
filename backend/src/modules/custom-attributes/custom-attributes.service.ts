import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomAttributeDefinition, AttributeEntityType } from './entities/custom-attribute-definition.entity';
import { CustomAttributeValue } from './entities/custom-attribute-value.entity';

@Injectable()
export class CustomAttributesService {
  constructor(
    @InjectRepository(CustomAttributeDefinition)
    private defsRepo: Repository<CustomAttributeDefinition>,
    @InjectRepository(CustomAttributeValue)
    private valsRepo: Repository<CustomAttributeValue>,
  ) {}

  async getDefinitions(entityType?: AttributeEntityType): Promise<CustomAttributeDefinition[]> {
    return this.defsRepo.find({
      where: entityType ? { entityType } : undefined,
      order: { displayName: 'ASC' },
    });
  }

  async createDefinition(data: Partial<CustomAttributeDefinition>): Promise<CustomAttributeDefinition> {
    const def = this.defsRepo.create(data);
    return this.defsRepo.save(def);
  }

  async updateDefinition(id: string, data: Partial<CustomAttributeDefinition>): Promise<CustomAttributeDefinition> {
    const def = await this.defsRepo.findOne({ where: { id } });
    if (!def) throw new NotFoundException('Definición no encontrada');
    Object.assign(def, data);
    return this.defsRepo.save(def);
  }

  async removeDefinition(id: string): Promise<void> {
    const def = await this.defsRepo.findOne({ where: { id } });
    if (!def) throw new NotFoundException('Definición no encontrada');
    await this.valsRepo.delete({ definition: { id } });
    await this.defsRepo.remove(def);
  }

  async getValues(entityId: string): Promise<CustomAttributeValue[]> {
    return this.valsRepo.find({ where: { entityId } });
  }

  async setValue(entityId: string, definitionId: string, value: string): Promise<CustomAttributeValue> {
    const def = await this.defsRepo.findOne({ where: { id: definitionId } });
    if (!def) throw new NotFoundException('Definición no encontrada');

    let val = await this.valsRepo.findOne({
      where: { entityId, definition: { id: definitionId } },
    });

    if (val) {
      val.valueText = value;
    } else {
      val = this.valsRepo.create({ entityId, definition: def, valueText: value });
    }
    return this.valsRepo.save(val);
  }

  async deleteValue(entityId: string, definitionId: string): Promise<void> {
    await this.valsRepo.delete({ entityId, definition: { id: definitionId } });
  }
}
