import {
  Controller,
  Get,
  Param,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtGuard } from '../common/jwt.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { Enrollment, EnrollmentDocument } from '../schemas/enrollment.schema';
import { Course, CourseDocument } from '../schemas/course.schema';

@Controller('courses/:courseId/episodes')
@UseGuards(JwtGuard)
export class EpisodesController {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
  ) {}

  @Get(':episodeId')
  async findOne(
    @Param('courseId') courseId: string,
    @Param('episodeId') episodeId: string,
    @CurrentUser() user: { userId: string },
  ) {
    const userOid = new Types.ObjectId(user.userId);
    const courseOid = new Types.ObjectId(courseId);

    const enrollment = await this.enrollmentModel.findOne({
      user_id: userOid,
      course_id: courseOid,
    });
    if (!enrollment) {
      throw new ForbiddenException('수강 신청 후 시청할 수 있습니다');
    }

    const course = await this.courseModel.findById(courseOid).lean();
    if (!course) throw new NotFoundException('강의를 찾을 수 없습니다');

    for (const section of course.sections ?? []) {
      const episode = section.episodes.find((ep) => String(ep._id) === episodeId);
      if (episode) {
        return {
          success: true,
          data: {
            _id: episode._id,
            title: episode.title,
            videoUrl: episode.videoUrl,
            duration: episode.duration,
            order: episode.order,
            section: {
              _id: section._id,
              title: section.title,
              order: section.order,
            },
          },
        };
      }
    }

    throw new NotFoundException('에피소드를 찾을 수 없습니다');
  }
}
