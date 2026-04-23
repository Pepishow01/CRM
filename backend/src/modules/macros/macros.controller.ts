import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MacrosService } from './macros.service';
import { CreateMacroDto } from './dto/create-macro.dto';

@ApiTags('Macros')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('macros')
export class MacrosController {
  constructor(private macrosService: MacrosService) {}

  @Get()
  findAll() {
    return this.macrosService.findAll();
  }

  @Post()
  create(@Body() dto: CreateMacroDto, @Request() req: any) {
    return this.macrosService.create(dto, req.user?.userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateMacroDto>) {
    return this.macrosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.macrosService.remove(id);
  }

  @Post(':id/execute/:chatId')
  execute(@Param('id') id: string, @Param('chatId') chatId: string) {
    return this.macrosService.execute(id, chatId);
  }
}
