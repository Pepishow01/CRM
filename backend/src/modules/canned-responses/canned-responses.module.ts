import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CannedResponse } from './entities/canned-response.entity';
import { CannedResponsesService } from './canned-responses.service';
import { CannedResponsesController } from './canned-responses.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CannedResponse])],
  providers: [CannedResponsesService],
  controllers: [CannedResponsesController],
  exports: [CannedResponsesService],
})
export class CannedResponsesModule {}
