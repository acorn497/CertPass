import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtGuard } from '../common/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { ExamsService } from './exams.service';

const ExamSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  timeLimit: z.number().nullable().optional(),
});
const QuestionSchema = z.object({
  content: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  answer: z.number().min(0).max(3),
  explanation: z.string().optional(),
  order: z.number(),
});
const AttemptSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      selected: z.number().min(0).max(3),
    }),
  ),
});

@Controller()
@UseGuards(JwtGuard, RolesGuard)
@Roles('student', 'instructor', 'admin')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get('courses/:courseId/exams')
  async findByCourse(
    @CurrentUser() user: { userId: string; role?: string },
    @Param('courseId') courseId: string,
  ) {
    const data = await this.examsService.findByCourse(
      user.userId,
      user.role ?? 'student',
      courseId,
    );
    return { success: true, data };
  }

  @Post('courses/:courseId/exams')
  @Roles('instructor', 'admin')
  async createExam(
    @CurrentUser() user: { userId: string; role?: string },
    @Param('courseId') courseId: string,
    @Body() body: unknown,
  ) {
    const result = ExamSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.issues[0].message);
    const data = await this.examsService.createExam(
      user.userId,
      user.role ?? 'student',
      courseId,
      result.data,
    );
    return { success: true, data };
  }

  @Get('exams/:examId/questions')
  async findQuestions(
    @CurrentUser() user: { userId: string; role?: string },
    @Param('examId') examId: string,
  ) {
    const data = await this.examsService.findQuestions(
      user.userId,
      user.role ?? 'student',
      examId,
    );
    return { success: true, data };
  }

  @Post('exams/:examId/questions')
  @Roles('instructor', 'admin')
  async createQuestion(
    @CurrentUser() user: { userId: string; role?: string },
    @Param('examId') examId: string,
    @Body() body: unknown,
  ) {
    const result = QuestionSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.issues[0].message);
    const data = await this.examsService.createQuestion(
      user.userId,
      user.role ?? 'student',
      examId,
      result.data,
    );
    return { success: true, data };
  }

  @Post('exams/:examId/attempts')
  async submitAttempt(
    @CurrentUser() user: { userId: string; role?: string },
    @Param('examId') examId: string,
    @Body() body: unknown,
  ) {
    const result = AttemptSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.issues[0].message);
    const data = await this.examsService.submitAttempt(
      user.userId,
      user.role ?? 'student',
      examId,
      result.data.answers,
    );
    return { success: true, data };
  }

  @Get('exams/:examId/attempts/me')
  async myAttempts(
    @CurrentUser() user: { userId: string },
    @Param('examId') examId: string,
  ) {
    const data = await this.examsService.myAttempts(user.userId, examId);
    return { success: true, data };
  }
}
