import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtGuard } from '../common/jwt.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { EnrollmentsService } from './enrollments.service';
import { z } from 'zod';

const EnrollSchema = z.object({
  courseId: z.string().min(1, 'courseId를 입력해주세요'),
});

@Controller('enrollments')
@UseGuards(JwtGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  async enroll(
    @CurrentUser() user: { userId: string },
    @Body() body: unknown,
  ) {
    const result = EnrollSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.errors[0].message);
    }
    const data = await this.enrollmentsService.enroll(
      user.userId,
      result.data.courseId,
    );
    return { success: true, data };
  }

  @Get('me')
  async getMyEnrollments(@CurrentUser() user: { userId: string }) {
    const data = await this.enrollmentsService.getMyEnrollments(user.userId);
    return { success: true, data };
  }

  @Get('me/:courseId')
  async checkEnrollment(
    @CurrentUser() user: { userId: string },
    @Param('courseId') courseId: string,
  ) {
    const data = await this.enrollmentsService.checkEnrollment(
      user.userId,
      courseId,
    );
    return { success: true, data };
  }
}
