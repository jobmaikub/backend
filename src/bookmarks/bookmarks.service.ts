import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

type BookmarkRow = {
  news_id: number;
  bookmarked_at: string;
};

@Injectable()
export class BookmarksService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getMyBookmarks(userId: string) {
    const { data: bookmarkRows, error: bookmarkError } =
      await this.supabaseService.client
        .from('news_bookmarks')
        .select('news_id, bookmarked_at')
        .eq('user_id', userId)
        .order('bookmarked_at', { ascending: false });

    if (bookmarkError) {
      throw new NotFoundException(bookmarkError.message);
    }

    const rows = (bookmarkRows ?? []) as BookmarkRow[];

    if (rows.length === 0) {
      return [];
    }

    const newsIds = rows.map((row) => row.news_id);

    const { data: newsRows, error: newsError } =
      await this.supabaseService.client
        .schema('admin')
        .from('news')
        .select('*, industries(name)')
        .in('news_id', newsIds);

    if (newsError) {
      throw new NotFoundException(newsError.message);
    }

    const newsById = new Map<number, any>();
    (newsRows ?? []).forEach((article) => {
      newsById.set(article.news_id, article);
    });

    return rows.map((row) => newsById.get(row.news_id)).filter(Boolean);
  }

  async addBookmark(userId: string, newsId: number) {
    await this.assertNewsExists(newsId);

    const { error } = await this.supabaseService.client
      .from('news_bookmarks')
      .upsert(
        {
          user_id: userId,
          news_id: newsId,
          bookmarked_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,news_id',
        },
      );

    if (error) {
      throw new BadRequestException(error.message);
    }

    return this.getMyBookmarks(userId);
  }

  async removeBookmark(userId: string, newsId: number) {
    const { error } = await this.supabaseService.client
      .from('news_bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('news_id', newsId);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return this.getMyBookmarks(userId);
  }

  private async assertNewsExists(newsId: number) {
    const { data, error } = await this.supabaseService.client
      .schema('admin')
      .from('news')
      .select('news_id')
      .eq('news_id', newsId)
      .maybeSingle();

    if (error) {
      throw new NotFoundException(error.message);
    }

    if (!data) {
      throw new NotFoundException('News not found');
    }
  }
}
