import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SearchService } from './search.service';

@ApiTags('Search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  globalSearch(@Query('q') q: string) {
    return this.searchService.globalSearch(q);
  }

  @Get('chats')
  filterChats(
    @Query('status') status?: string,
    @Query('channel') channel?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('labelId') labelId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.searchService.filterChats({ status, channel, assignedTo, labelId, from, to });
  }
}
