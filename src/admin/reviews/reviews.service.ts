import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

interface CreateReviewData {
  career_id: number;
  user_id?: string;
  author: string;
  rating: number;
  comment: string;
}

interface UpdateReviewData {
  rating?: number;
  comment?: string;
}

interface AddReplyData {
  user_id?: string;
  author: string;
  comment: string;
  rating?: number;
}

@Injectable()
export class ReviewsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  /* ================= CREATE REVIEW ================= */
  async createReview(data: CreateReviewData) {
    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const reviewData = {
      career_id: data.career_id,
      user_id: data.user_id,
      author: data.author,
      rating: data.rating,
      comment: data.comment,
      likes: 0,
      created_at: new Date().toISOString(),
    };

    const { data: result, error } = await this.supabaseService.client
      .from('reviews')
      .insert(reviewData)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return this.mapReview(result);
  }

  /* ================= GET ALL REVIEWS ================= */
  async getAllReviews() {
    const { data, error } = await this.supabaseService.client
      .from('reviews')
      .select()
      .order('created_at', { ascending: false });

    if (error) {
      throw new NotFoundException(error.message);
    }

    return data.map((review) => this.mapReview(review));
  }

  /* ================= GET REVIEWS BY CAREER ================= */
  async getReviewsByCareer(careerId: number) {
    const { data, error } = await this.supabaseService.client
      .from('reviews')
      .select()
      .eq('career_id', careerId)
      .is('parent_review_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new NotFoundException(error.message);
    }

    // Map reviews and fetch replies for each
    const reviewsWithReplies = await Promise.all(
      data.map(async (review) => {
        const mappedReview = this.mapReview(review);
        const replies = await this.getReplyForReview(review.review_id);
        return {
          ...mappedReview,
          replies: replies,
        };
      }),
    );

    return reviewsWithReplies;
  }

  /* ================= GET REVIEW BY ID ================= */
  async getReviewById(id: number) {
    const { data, error } = await this.supabaseService.client
      .from('reviews')
      .select()
      .eq('review_id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Review not found');
    }

    const mappedReview = this.mapReview(data);
    const replies = await this.getReplyForReview(id);

    return {
      ...mappedReview,
      replies: replies,
    };
  }

  /* ================= GET REPLIES FOR REVIEW ================= */
  private async getReplyForReview(parentReviewId: number) {
    const { data, error } = await this.supabaseService.client
      .from('reviews')
      .select()
      .eq('parent_review_id', parentReviewId)
      .order('created_at', { ascending: true });

    if (error) {
      return [];
    }

    return data.map((reply) => this.mapReview(reply));
  }

  /* ================= UPDATE REVIEW ================= */
  async updateReview(id: number, data: UpdateReviewData) {
    // Validate rating if provided
    if (data.rating && (data.rating < 1 || data.rating > 5)) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const { data: result, error } = await this.supabaseService.client
      .from('reviews')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('review_id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return this.mapReview(result);
  }

  /* ================= DELETE REVIEW ================= */
  async deleteReview(id: number) {
    // First, delete all replies to this review
    await this.supabaseService.client
      .from('reviews')
      .delete()
      .eq('parent_review_id', id);

    // Then delete the review itself
    const { data, error } = await this.supabaseService.client
      .from('reviews')
      .delete()
      .eq('review_id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return this.mapReview(data);
  }

  /* ================= ADD LIKE ================= */
  async addLike(id: number) {
    // Get current likes
    const { data: review, error: getError } = await this.supabaseService.client
      .from('reviews')
      .select('likes')
      .eq('review_id', id)
      .single();

    if (getError || !review) {
      throw new NotFoundException('Review not found');
    }

    // Increment likes
    const { data: result, error } = await this.supabaseService.client
      .from('reviews')
      .update({
        likes: review.likes + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('review_id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return this.mapReview(result);
  }

  /* ================= ADD REPLY ================= */
  async addReply(parentReviewId: number, data: AddReplyData) {
    // Validate that parent review exists
    const { data: parentReview, error: parentError } =
      await this.supabaseService.client
        .from('reviews')
        .select('review_id')
        .eq('review_id', parentReviewId)
        .single();

    if (parentError || !parentReview) {
      throw new NotFoundException('Parent review not found');
    }

    // Validate rating if provided
    if (data.rating && (data.rating < 1 || data.rating > 5)) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const replyData = {
      parent_review_id: parentReviewId,
      user_id: data.user_id,
      author: data.author,
      rating: data.rating || 0,
      comment: data.comment,
      likes: 0,
      created_at: new Date().toISOString(),
    };

    const { data: result, error } = await this.supabaseService.client
      .from('reviews')
      .insert(replyData)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(error.message);
    }

    return this.mapReview(result);
  }

  /* ================= MAP REVIEW ================= */
  private mapReview(review: any) {
    return {
      id: review.review_id,
      author: review.author,
      rating: review.rating,
      comment: review.comment,
      likes: review.likes,
      date: new Date(review.created_at).toLocaleDateString('th-TH'),
      careerId: review.career_id,
    };
  }
}
