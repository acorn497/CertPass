import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtGuard } from '../common/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { ReviewsService } from './reviews.service';

const ReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  content: z.string().min(1),
});
const UpdateReviewSchema = ReviewSchema.partial();

@Controller('courses/:courseId/reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  async findByCourse(
    @Param('courseId') courseId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.reviewsService.findByCourse(
      courseId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
    return { success: true, data };
  }

  @Post()
  @UseGuards(JwtGuard)
  async create(
    @CurrentUser() user: { userId: string },
    @Param('courseId') courseId: string,
    @Body() body: unknown,
  ) {
    const result = ReviewSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.issues[0].message);
    const data = await this.reviewsService.create(user.userId, courseId, result.data);
    return { success: true, data };
  }

  @Patch(':reviewId')
  @UseGuards(JwtGuard)
  async update(
    @CurrentUser() user: { userId: string },
    @Param('courseId') courseId: string,
    @Param('reviewId') reviewId: string,
    @Body() body: unknown,
  ) {
    const result = UpdateReviewSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.issues[0].message);
    const data = await this.reviewsService.update(user.userId, courseId, reviewId, result.data);
    return { success: true, data };
  }

  @Delete(':reviewId')
  @Roles('student', 'instructor', 'admin')
  @UseGuards(JwtGuard, RolesGuard)
  async remove(
    @CurrentUser() user: { userId: string; role?: string },
    @Param('courseId') courseId: string,
    @Param('reviewId') reviewId: string,
  ) {
    const data = await this.reviewsService.remove(
      user.userId,
      user.role ?? 'student',
      courseId,
      reviewId,
    );
    return { success: true, data };
  }
}
