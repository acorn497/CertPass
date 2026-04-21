import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../common/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { InstructorService } from './instructor.service';

@Controller('instructor')
@Roles('instructor', 'admin')
@UseGuards(JwtGuard, RolesGuard)
export class InstructorController {
  constructor(private readonly instructorService: InstructorService) {}

  @Get('courses')
  async myCourses(@CurrentUser() user: { userId: string; role?: string }) {
    const data = await this.instructorService.myCourses(
      user.userId,
      user.role ?? 'instructor',
    );
    return { success: true, data };
  }

  @Get('courses/:courseId/stats')
  async stats(
    @CurrentUser() user: { userId: string; role?: string },
    @Param('courseId') courseId: string,
  ) {
    const data = await this.instructorService.stats(
      user.userId,
      user.role ?? 'instructor',
      courseId,
    );
    return { success: true, data };
  }
}
