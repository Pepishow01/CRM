import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CustomAttributesService } from './custom-attributes.service';
import { AttributeEntityType } from './entities/custom-attribute-definition.entity';

@ApiTags('Custom Attributes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('custom-attributes')
export class CustomAttributesController {
  constructor(private service: CustomAttributesService) {}

  @Get('definitions')
  getDefinitions(@Query('entityType') entityType?: AttributeEntityType) {
    return this.service.getDefinitions(entityType);
  }

  @Post('definitions')
  createDefinition(@Body() body: any) {
    return this.service.createDefinition(body);
  }

  @Patch('definitions/:id')
  updateDefinition(@Param('id') id: string, @Body() body: any) {
    return this.service.updateDefinition(id, body);
  }

  @Delete('definitions/:id')
  removeDefinition(@Param('id') id: string) {
    return this.service.removeDefinition(id);
  }

  @Get('values/:entityId')
  getValues(@Param('entityId') entityId: string) {
    return this.service.getValues(entityId);
  }

  @Post('values/:entityId/:definitionId')
  setValue(
    @Param('entityId') entityId: string,
    @Param('definitionId') definitionId: string,
    @Body() body: { value: string },
  ) {
    return this.service.setValue(entityId, definitionId, body.value);
  }

  @Delete('values/:entityId/:definitionId')
  deleteValue(
    @Param('entityId') entityId: string,
    @Param('definitionId') definitionId: string,
  ) {
    return this.service.deleteValue(entityId, definitionId);
  }
}
