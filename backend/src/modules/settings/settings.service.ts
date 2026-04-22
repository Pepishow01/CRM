import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingsRepo: Repository<Setting>,
  ) {}

  async get(key: string): Promise<string | null> {
    const setting = await this.settingsRepo.findOne({ where: { key } });
    return setting ? setting.value : null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.settingsRepo.save({ key, value });
  }

  async getAll(): Promise<Record<string, string>> {
    const all = await this.settingsRepo.find();
    return all.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});
  }
}
