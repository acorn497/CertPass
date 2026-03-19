import { Controller, Get, Param, Query } from '@nestjs/common';
import { CoursesService } from './courses.service';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('level') level?: string,
  ) {
    const data = await this.coursesService.findAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 12,
      category,
      level,
    });
    return { success: true, data };
  }

  @Get(':courseId')
  async findOne(@Param('courseId') courseId: string) {
    const data = await this.coursesService.findOne(courseId);
    return { success: true, data };
  }
}
