import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../common/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@Roles('admin')
@UseGuards(JwtGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async stats() {
    const data = await this.adminService.stats();
    return { success: true, data };
  }

  @Get('courses')
  async courses() {
    const data = await this.adminService.courses();
    return { success: true, data };
  }

  @Get('moderation')
  async moderation() {
    const data = await this.adminService.moderation();
    return { success: true, data };
  }

  @Delete('courses/:courseId')
  async removeCourse(@Param('courseId') courseId: string) {
    const data = await this.adminService.removeCourse(courseId);
    return { success: true, data };
  }

  @Delete('qna/:postId')
  async removeQnaPost(@Param('postId') postId: string) {
    const data = await this.adminService.removeQnaPost(postId);
    return { success: true, data };
  }

  @Delete('qna/comments/:commentId')
  async removeQnaComment(@Param('commentId') commentId: string) {
    const data = await this.adminService.removeQnaComment(commentId);
    return { success: true, data };
  }

  @Delete('reviews/:reviewId')
  async removeReview(@Param('reviewId') reviewId: string) {
    const data = await this.adminService.removeReview(reviewId);
    return { success: true, data };
  }
}
