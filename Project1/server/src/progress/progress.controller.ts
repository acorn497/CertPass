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
import { ProgressService } from './progress.service';
import { z } from 'zod';

const CompleteEpisodeSchema = z.object({
  courseId: z.string().min(1),
  episodeId: z.string().min(1),
});

@Controller('progress')
@UseGuards(JwtGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get(':courseId')
  async getCourseProgress(
    @CurrentUser() user: { userId: string },
    @Param('courseId') courseId: string,
  ) {
    const data = await this.progressService.getCourseProgress(
      user.userId,
      courseId,
    );
    return { success: true, data };
  }

  @Post()
  async completeEpisode(
    @CurrentUser() user: { userId: string },
    @Body() body: unknown,
  ) {
    const result = CompleteEpisodeSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.errors[0].message);
    }
    const data = await this.progressService.completeEpisode(
      user.userId,
      result.data.courseId,
      result.data.episodeId,
    );
    return { success: true, data };
  }
}
