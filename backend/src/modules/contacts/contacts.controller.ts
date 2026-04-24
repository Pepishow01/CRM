import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ContactsService } from './contacts.service';

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.contactsService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contactsService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { fullName?: string; email?: string; phone?: string; notesSummary?: string },
  ) {
    return this.contactsService.updateContact(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contactsService.removeContact(id);
  }

  @Get(':id/notes')
  getNotes(@Param('id') id: string) {
    return this.contactsService.getNotes(id);
  }

  @Post(':id/notes')
  addNote(
    @Param('id') id: string,
    @Body() body: { content: string },
    @Request() req: any,
  ) {
    return this.contactsService.addNote(id, body.content, req.user?.sub);
  }

  @Delete(':id/notes/:noteId')
  deleteNote(@Param('noteId') noteId: string) {
    return this.contactsService.deleteNote(noteId);
  }
}
