import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../common/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { InstructorApplicationsService } from './instructor-applications.service';
import {
  CreateApplicationSchema,
  ReviewApplicationSchema,
  ListApplicationsQuerySchema,
} from './instructor-applications.dto';

@Controller('instructor-applications')
export class InstructorApplicationsController {
  constructor(private readonly service: InstructorApplicationsService) {}

  // 일반 회원: 강사 신청
  @Post()
  @UseGuards(JwtGuard)
  async create(@CurrentUser() user: { userId: string }, @Body() body: unknown) {
    const result = CreateApplicationSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.issues[0].message);
    const data = await this.service.create(user.userId, result.data);
    return { success: true, data };
  }

  // 일반 회원: 내 신청 상태 조회
  @Get('me')
  @UseGuards(JwtGuard)
  async findMine(@CurrentUser() user: { userId: string }) {
    const data = await this.service.findMine(user.userId);
    return { success: true, data };
  }

  // 관리자: 신청 목록
  @Get()
  @Roles('admin')
  @UseGuards(JwtGuard, RolesGuard)
  async findAll(@Query() query: unknown) {
    const result = ListApplicationsQuerySchema.safeParse(query);
    if (!result.success) throw new BadRequestException(result.error.issues[0].message);
    const data = await this.service.findAll(result.data.status);
    return { success: true, data };
  }

  // 관리자: 승인
  @Patch(':id/approve')
  @Roles('admin')
  @UseGuards(JwtGuard, RolesGuard)
  async approve(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const result = ReviewApplicationSchema.safeParse(body ?? {});
    if (!result.success) throw new BadRequestException(result.error.issues[0].message);
    const data = await this.service.approve(id, user.userId, result.data);
    return { success: true, data };
  }

  // 관리자: 거절
  @Patch(':id/reject')
  @Roles('admin')
  @UseGuards(JwtGuard, RolesGuard)
  async reject(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const result = ReviewApplicationSchema.safeParse(body ?? {});
    if (!result.success) throw new BadRequestException(result.error.issues[0].message);
    const data = await this.service.reject(id, user.userId, result.data);
    return { success: true, data };
  }
}
