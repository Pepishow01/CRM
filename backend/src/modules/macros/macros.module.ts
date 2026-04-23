import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Macro } from './entities/macro.entity';
import { MacrosService } from './macros.service';
import { MacrosController } from './macros.controller';
import { ChatsModule } from '../chats/chats.module';
import { LabelsModule } from '../labels/labels.module';

@Module({
  imports: [TypeOrmModule.forFeature([Macro]), ChatsModule, LabelsModule],
  providers: [MacrosService],
  controllers: [MacrosController],
  exports: [MacrosService],
})
export class MacrosModule {}
