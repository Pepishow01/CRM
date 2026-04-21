import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async check(): Promise<{ status: string; database: string; uptime: number }> {
    let databaseStatus = 'ok';

    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      databaseStatus = 'unreachable';
    }

    return {
      status: 'ok',
      database: databaseStatus,
      uptime: Math.floor(process.uptime()),
    };
  }
}
