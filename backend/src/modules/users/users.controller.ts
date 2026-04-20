import {
  Controller, Get, Post, Patch, Param,
  Body, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los usuarios' })
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Crear usuario' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Desactivar usuario' })
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }
}