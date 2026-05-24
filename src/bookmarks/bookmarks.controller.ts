import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { BookmarksService } from './bookmarks.service';

@Controller('bookmarks')
@UseGuards(SupabaseAuthGuard)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Get()
  getMyBookmarks(@Req() req: any) {
    return this.bookmarksService.getMyBookmarks(req.user.id);
  }

  @Post(':newsId')
  addBookmark(@Req() req: any, @Param('newsId') newsId: string) {
    return this.bookmarksService.addBookmark(req.user.id, Number(newsId));
  }

  @Delete(':newsId')
  removeBookmark(@Req() req: any, @Param('newsId') newsId: string) {
    return this.bookmarksService.removeBookmark(req.user.id, Number(newsId));
  }
}
