import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AutomationsService } from './automations.service';

@ApiTags('Automations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('automations')
export class AutomationsController {
  constructor(private automationsService: AutomationsService) {}

  @Get()
  findAll() { return this.automationsService.findAll(); }

  @Post()
  create(@Body() body: any) { return this.automationsService.create(body); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.automationsService.update(id, body); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.automationsService.remove(id); }
}
