import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CannedResponsesService } from './canned-responses.service';
import { CreateCannedResponseDto } from './dto/create-canned-response.dto';

@ApiTags('Canned Responses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('canned-responses')
export class CannedResponsesController {
  constructor(private service: CannedResponsesService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.service.findAll(search);
  }

  @Post()
  create(@Body() dto: CreateCannedResponseDto, @Request() req: any) {
    return this.service.create(dto, req.user.userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateCannedResponseDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
