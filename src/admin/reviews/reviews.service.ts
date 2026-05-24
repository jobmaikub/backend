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

  /* ================= GET REVIEWS BY USER ================= */
  async getReviewsByUser(userId: string) {
    // 1. Fetch reviews directly from public.reviews for immediate results
    const { data: reviews, error: reviewsError } =
      await this.supabaseService.client
        .from('reviews')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (reviewsError) {
      throw new NotFoundException(reviewsError.message);
    }

    if (!reviews || reviews.length === 0) {
      return [];
    }

    // 2. Fetch career titles from admin.careers
    const careerIds = [...new Set(reviews.map((r) => r.career_id))];
    const { data: careers } = await this.supabaseService.client
      .schema('admin')
      .from('careers')
      .select('career_id, title')
      .in('career_id', careerIds);

    const careerMap = new Map(
      careers?.map((c) => [c.career_id, c.title]) || [],
    );

    return reviews.map((review: any) => ({
      ...this.mapReview(review),
      careerTitle:
        careerMap.get(review.career_id) || `Career #${review.career_id}`,
    }));
  }

  /* ================= GET REVIEWS BY CAREER ================= */
  async getReviewsByCareer(careerId: number, userId?: string) {
    const { data: reviews, error } = await this.supabaseService.client
      .from('reviews')
      .select('*')
      .eq('career_id', careerId)
      .is('parent_review_id', null)
      .order('created_at', { ascending: false });

    if (error) throw new NotFoundException(error.message);

    // Get all replies for these reviews
    const { data: replies } = await this.supabaseService.client
      .from('reviews')
      .select('*')
      .eq('career_id', careerId)
      .not('parent_review_id', 'is', null);

    // Get liked status if userId is provided
    let likedReviewIds = new Set<number>();
    if (userId) {
      const { data: likedRows } = await this.supabaseService.client
        .from('review_likes')
        .select('review_id')
        .eq('user_id', userId);

      if (likedRows) {
        likedReviewIds = new Set(likedRows.map((r) => r.review_id));
      }
    }

    return (reviews || []).map((r) => {
      const reviewReplies = (replies || [])
        .filter((rep) => rep.parent_review_id === r.review_id)
        .map((rep) => ({
          ...this.mapReview(rep),
          isLikedByMe: likedReviewIds.has(rep.review_id),
        }));

      return {
        ...this.mapReview(r),
        isLikedByMe: likedReviewIds.has(r.review_id),
        replies: reviewReplies,
      };
    });
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

  /* ================= TOGGLE LIKE ================= */
  async toggleLike(reviewId: number, userId: string) {
    // 1. Check if the user already liked this review
    const { data: existingLike, error: checkError } =
      await this.supabaseService.client
        .from('review_likes')
        .select('like_id')
        .eq('review_id', reviewId)
        .eq('user_id', userId)
        .single();

    // Get current review to update total likes
    const { data: review, error: getError } = await this.supabaseService.client
      .from('reviews')
      .select('likes')
      .eq('review_id', reviewId)
      .single();

    if (getError || !review) {
      throw new NotFoundException('Review not found');
    }

    let newLikesCount = review.likes;

    if (existingLike) {
      // 2. Already liked -> UNLIKE
      const { error: deleteError } = await this.supabaseService.client
        .from('review_likes')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', userId);

      if (deleteError) throw new BadRequestException(deleteError.message);
      newLikesCount = Math.max(0, review.likes - 1);
    } else {
      // 3. Not liked yet -> LIKE
      const { error: insertError } = await this.supabaseService.client
        .from('review_likes')
        .insert({
          review_id: reviewId,
          user_id: userId,
        });

      if (insertError) throw new BadRequestException(insertError.message);
      newLikesCount = review.likes + 1;
    }

    // 4. Update the total likes count in the reviews table
    const { data: result, error: updateError } =
      await this.supabaseService.client
        .from('reviews')
        .update({
          likes: newLikesCount,
          updated_at: new Date().toISOString(),
        })
        .eq('review_id', reviewId)
        .select()
        .single();

    if (updateError) throw new BadRequestException(updateError.message);

    return {
      ...this.mapReview(result),
      isLiked: !existingLike, // Return whether it is now liked
    };
  }

  /* ================= ADD REPLY ================= */
  async addReply(parentReviewId: number, data: AddReplyData) {
    // Validate that parent review exists
    const { data: parentReview, error: parentError } =
      await this.supabaseService.client
        .from('reviews')
        .select('review_id, career_id')
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
      career_id: parentReview.career_id,
      user_id: data.user_id,
      author: data.author,
      rating: data.rating || 5, // Default to 5 to pass check constraint (1-5)
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

  /* ================= REPORT REVIEW ================= */
  async reportReview(
    reviewId: number,
    data: { userId: string; reportType: string; reason?: string },
  ) {
    // 1. ดึงข้อมูลรีวิว
    const { data: review, error: fetchError } =
      await this.supabaseService.client
        .from('reviews')
        .select('user_id')
        .eq('review_id', reviewId)
        .single();

    if (fetchError || !review) {
      console.error('Fetch review error:', fetchError);
      throw new NotFoundException('Review not found');
    }

    // 2. ป้องกันการ Report ตัวเอง
    if (data.userId === review.user_id) {
      throw new BadRequestException('You cannot report your own review');
    }

    // 3. บันทึกลงตาราง user_reports
    const insertData = {
      by_user_id: data.userId,
      report_user_id: review.user_id,
      review_id: reviewId,
      report_type: data.reportType, // เก็บหัวข้อที่เลือก (เช่น Spam, Harassment)
      reason: data.reason || `Reported as ${data.reportType}`, // เก็บรายละเอียดที่พิมพ์เพิ่ม
      status: 'pending',
    };

    const { data: result, error } = await this.supabaseService.client
      .from('user_reports')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase Insert Error:', error);
      throw new BadRequestException(`Database Error: ${error.message}`);
    }

    return result;
  }

  /* ================= MAP REVIEW ================= */
  private mapReview(review: any) {
    return {
      id: review.review_id,
      userId: review.user_id,
      author: review.author,
      rating: review.rating,
      comment: review.comment,
      likes: review.likes,
      date: new Date(review.created_at).toLocaleDateString('th-TH'),
      careerId: review.career_id,
      parentReviewId: review.parent_review_id,
    };
  }
}
