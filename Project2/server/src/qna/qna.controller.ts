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
import { QnaService } from './qna.service';

const PostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});
const UpdatePostSchema = PostSchema.partial();
const CommentSchema = z.object({ content: z.string().min(1) });

@Controller()
@UseGuards(JwtGuard)
export class QnaController {
  constructor(private readonly qnaService: QnaService) {}

  @Get('courses/:courseId/qna')
  async findByCourse(
    @CurrentUser() user: { userId: string },
    @Param('courseId') courseId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.qnaService.findByCourse(
      user.userId,
      courseId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
    return { success: true, data };
  }

  @Post('courses/:courseId/qna')
  async create(
    @CurrentUser() user: { userId: string },
    @Param('courseId') courseId: string,
    @Body() body: unknown,
  ) {
    const result = PostSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.issues[0].message);
    const data = await this.qnaService.create(user.userId, courseId, result.data);
    return { success: true, data };
  }

  @Get('qna/:postId')
  async findOne(
    @CurrentUser() user: { userId: string },
    @Param('postId') postId: string,
  ) {
    const data = await this.qnaService.findOne(user.userId, postId);
    return { success: true, data };
  }

  @Post('qna/:postId/comments')
  @Roles('student', 'instructor', 'admin')
  @UseGuards(RolesGuard)
  async addComment(
    @CurrentUser() user: { userId: string; role?: string },
    @Param('postId') postId: string,
    @Body() body: unknown,
  ) {
    const result = CommentSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.issues[0].message);
    const data = await this.qnaService.addComment(
      user.userId,
      user.role ?? 'student',
      postId,
      result.data.content,
    );
    return { success: true, data };
  }

  @Patch('qna/:postId')
  async update(
    @CurrentUser() user: { userId: string },
    @Param('postId') postId: string,
    @Body() body: unknown,
  ) {
    const result = UpdatePostSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.issues[0].message);
    const data = await this.qnaService.update(user.userId, postId, result.data);
    return { success: true, data };
  }

  @Delete('qna/:postId')
  @Roles('student', 'instructor', 'admin')
  @UseGuards(RolesGuard)
  async remove(
    @CurrentUser() user: { userId: string; role?: string },
    @Param('postId') postId: string,
  ) {
    const data = await this.qnaService.remove(user.userId, user.role ?? 'student', postId);
    return { success: true, data };
  }
}
