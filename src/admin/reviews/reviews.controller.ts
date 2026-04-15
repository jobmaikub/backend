import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /* ================= CREATE ================= */
  @Post()
  async createReview(
    @Body()
    body: {
      by_user_id?: number;
      career_id: number;
      user_id?: string;
      author: string;
      rating: number;
      comment: string;
    },
  ) {
    return this.reviewsService.createReview(body);
  }

  /* ================= GET ALL REVIEWS ================= */
  @Get()
  async getReviews(@Query('career_id') careerId?: string) {
    if (careerId) {
      return this.reviewsService.getReviewsByCareer(Number(careerId));
    }
    return this.reviewsService.getAllReviews();
  }

  /* ================= GET REVIEW BY ID ================= */
  @Get(':id')
  async getReviewById(@Param('id') id: string) {
    return this.reviewsService.getReviewById(Number(id));
  }

  /* ================= UPDATE REVIEW ================= */
  @Patch(':id')
  async updateReview(
    @Param('id') id: string,
    @Body()
    body: {
      rating?: number;
      comment?: string;
    },
  ) {
    return this.reviewsService.updateReview(Number(id), body);
  }

  /* ================= DELETE REVIEW ================= */
  @Delete(':id')
  async deleteReview(@Param('id') id: string) {
    return this.reviewsService.deleteReview(Number(id));
  }

  /* ================= ADD LIKE ================= */
  @Patch(':id/like')
  async addLike(@Param('id') id: string) {
    return this.reviewsService.addLike(Number(id));
  }

  /* ================= ADD REPLY ================= */
  @Post(':id/replies')
  async addReply(
    @Param('id') id: string,
    @Body()
    body: {
      user_id?: string;
      author: string;
      comment: string;
      rating?: number;
    },
  ) {
    return this.reviewsService.addReply(Number(id), body);
  }
}
