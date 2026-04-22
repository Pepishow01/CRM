import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async findAll() {
    return this.settingsService.getAll();
  }

  @Post()
  async update(@Body() body: { key: string; value: string }) {
    await this.settingsService.set(body.key, body.value);
    return { status: 'ok' };
  }
}
