import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactsService } from './contacts.service';
import { Contact } from './entities/contact.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contact])],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}