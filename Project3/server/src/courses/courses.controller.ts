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
import { CoursesService } from './courses.service';
import { JwtGuard } from '../common/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { OptionalJwtGuard } from '../common/optional-jwt.guard';

const CourseSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  categoryId: z.string().min(1),
  examName: z.string().min(1),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  price: z.coerce.number().min(0).optional(),
  thumbnail: z.string().url().nullable().optional(),
});

const UpdateCourseSchema = CourseSchema.partial();
const CourseStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
});
const ThumbnailSchema = z.object({ thumbnail: z.string().url() });
const SectionSchema = z.object({ title: z.string().min(1), order: z.number() });
const UpdateSectionSchema = SectionSchema.partial();
const EpisodeSchema = z.object({
  title: z.string().min(1),
  videoUrl: z.string().min(1),
  duration: z.number().min(0),
  order: z.number(),
});
const UpdateEpisodeSchema = EpisodeSchema.partial();

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('level') level?: string,
    @Query('q') q?: string,
  ) {
    const data = await this.coursesService.findAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 12,
      category,
      level,
      q,
    });
    return { success: true, data };
  }

  @Get(':courseId')
  @UseGuards(OptionalJwtGuard)
  async findOne(
    @Param('courseId') courseId: string,
    @CurrentUser() user?: { userId: string },
  ) {
    const data = await this.coursesService.findOne(courseId, user?.userId);
    return { success: true, data };
  }

  @Post()
  @Roles('instructor', 'admin')
  @UseGuards(JwtGuard, RolesGuard)
  async create(
    @CurrentUser() user: { userId: string },
    @Body() body: unknown,
  ) {
    const result = CourseSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.issues[0].message);
    const data = await this.coursesService.create(user.userId, result.data);
    return { success: true, data };
  }

  @Patch(':courseId')
  @Roles('instructor', 'admin')
  @UseGuards(JwtGuard, RolesGuard)
  async update(
    @CurrentUser() user: { userId: string; role?: string },
    @Param('courseId') courseId: string,
    @Body() body: unknown,
  ) {
    const result = UpdateCourseSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.issues[0].message);
    const data = await this.coursesService.update(user.userId, courseId, user.role ?? '', result.data);
    return { success: true, data };
  }

  @Delete(':courseId')
  @Roles('instructor', 'admin')
  @UseGuards(JwtGuard, RolesGuard)
  async remove(
    @CurrentUser() user: { userId: string; role?: string },
    @Param('courseId') courseId: string,
  ) {
    const data = await this.coursesService.remove(user.userId, courseId, user.role ?? '');
    return { success: true, data };
  }

  @Post(':courseId/resubmit')
  @Roles('instructor', 'admin')
  @UseGuards(JwtGuard, RolesGuard)
  async resubmit(
    @CurrentUser() user: { userId: string; role?: string },
    @Param('courseId') courseId: string,
  ) {
    const data = await this.coursesService.resubmit(user.userId, courseId, user.role ?? '');
    return { success: true, data };
  }

  @Patch(':courseId/status')
  @Roles('admin')
  @UseGuards(JwtGuard, RolesGuard)
  async updateStatus(@Param('courseId') courseId: string, @Body() body: unknown) {
    const result = CourseStatusSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.issues[0].message);
    const data = await this.coursesService.updateStatus(courseId, result.data.status);
    return { success: true, data };
  }

  @Post(':courseId/thumbnail')
  @Roles('instructor', 'admin')
  @UseGuards(JwtGuard, RolesGuard)
  async updateThumbnail(
    @CurrentUser() user: { userId: string; role?: string },
    @Param('courseId') courseId: string,
    @Body() body: unknown,
  ) {
    const result = ThumbnailSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.issues[0].message);
    const data = await this.coursesService.updateThumbnail(
      user.userId,
      courseId,
      user.role ?? '',
      result.data.thumbnail,
    );
    return { success: true, data };
  }

  @Post(':courseId/sections')
  @Roles('instructor', 'admin')
  @UseGuards(JwtGuard, RolesGuard)
  async createSection(
    @CurrentUser() user: { userId: string; role?: string },
    @Param('courseId') courseId: string,
    @Body() body: unknown,
  ) {
    const result = SectionSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.issues[0].message);
    const data = await this.coursesService.createSection(user.userId, courseId, user.role ?? '', result.data);
    return { success: true, data };
  }

  @Patch(':courseId/sections/:sectionId')
  @Roles('instructor', 'admin')
  @UseGuards(JwtGuard, RolesGuard)
  async updateSection(
    @CurrentUser() user: { userId: string; role?: string },
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Body() body: unknown,
  ) {
    const result = UpdateSectionSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.issues[0].message);
    const data = await this.coursesService.updateSection(
      user.userId,
      courseId,
      sectionId,
      user.role ?? '',
      result.data,
    );
    return { success: true, data };
  }

  @Delete(':courseId/sections/:sectionId')
  @Roles('instructor', 'admin')
  @UseGuards(JwtGuard, RolesGuard)
  async removeSection(
    @CurrentUser() user: { userId: string; role?: string },
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
  ) {
    const data = await this.coursesService.removeSection(user.userId, courseId, sectionId, user.role ?? '');
    return { success: true, data };
  }

  @Post(':courseId/sections/:sectionId/episodes')
  @Roles('instructor', 'admin')
  @UseGuards(JwtGuard, RolesGuard)
  async createEpisode(
    @CurrentUser() user: { userId: string; role?: string },
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Body() body: unknown,
  ) {
    const result = EpisodeSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.issues[0].message);
    const data = await this.coursesService.createEpisode(
      user.userId,
      courseId,
      sectionId,
      user.role ?? '',
      result.data,
    );
    return { success: true, data };
  }

  @Patch(':courseId/sections/:sectionId/episodes/:episodeId')
  @Roles('instructor', 'admin')
  @UseGuards(JwtGuard, RolesGuard)
  async updateEpisode(
    @CurrentUser() user: { userId: string; role?: string },
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Param('episodeId') episodeId: string,
    @Body() body: unknown,
  ) {
    const result = UpdateEpisodeSchema.safeParse(body);
    if (!result.success) throw new BadRequestException(result.error.issues[0].message);
    const data = await this.coursesService.updateEpisode(
      user.userId,
      courseId,
      sectionId,
      episodeId,
      user.role ?? '',
      result.data,
    );
    return { success: true, data };
  }

  @Delete(':courseId/sections/:sectionId/episodes/:episodeId')
  @Roles('instructor', 'admin')
  @UseGuards(JwtGuard, RolesGuard)
  async removeEpisode(
    @CurrentUser() user: { userId: string; role?: string },
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Param('episodeId') episodeId: string,
  ) {
    const data = await this.coursesService.removeEpisode(
      user.userId,
      courseId,
      sectionId,
      episodeId,
      user.role ?? '',
    );
    return { success: true, data };
  }
}
