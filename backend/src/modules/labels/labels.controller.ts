import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LabelsService } from './labels.service';
import { CreateLabelDto } from './dto/create-label.dto';

@ApiTags('Labels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('labels')
export class LabelsController {
  constructor(private labelsService: LabelsService) {}

  @Get()
  findAll() {
    return this.labelsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateLabelDto) {
    return this.labelsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateLabelDto>) {
    return this.labelsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.labelsService.remove(id);
  }

  @Get('chat/:chatId')
  getChatLabels(@Param('chatId') chatId: string) {
    return this.labelsService.getChatLabels(chatId);
  }

  @Post('chat/:chatId/:labelId')
  addToChat(
    @Param('chatId') chatId: string,
    @Param('labelId') labelId: string,
  ) {
    return this.labelsService.addToChat(chatId, labelId);
  }

  @Delete('chat/:chatId/:labelId')
  removeFromChat(
    @Param('chatId') chatId: string,
    @Param('labelId') labelId: string,
  ) {
    return this.labelsService.removeFromChat(chatId, labelId);
  }
}
