import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomAttributeDefinition } from './entities/custom-attribute-definition.entity';
import { CustomAttributeValue } from './entities/custom-attribute-value.entity';
import { CustomAttributesService } from './custom-attributes.service';
import { CustomAttributesController } from './custom-attributes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CustomAttributeDefinition, CustomAttributeValue])],
  providers: [CustomAttributesService],
  controllers: [CustomAttributesController],
  exports: [CustomAttributesService],
})
export class CustomAttributesModule {}
