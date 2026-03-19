import {
  Controller,
  Get,
  Param,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtGuard } from '../common/jwt.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { Episode, EpisodeDocument } from '../schemas/episode.schema';
import { Enrollment, EnrollmentDocument } from '../schemas/enrollment.schema';
import { Section, SectionDocument } from '../schemas/section.schema';

@Controller('courses/:courseId/episodes')
@UseGuards(JwtGuard)
export class EpisodesController {
  constructor(
    @InjectModel(Episode.name) private episodeModel: Model<EpisodeDocument>,
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Section.name) private sectionModel: Model<SectionDocument>,
  ) {}

  @Get(':episodeId')
  async findOne(
    @Param('courseId') courseId: string,
    @Param('episodeId') episodeId: string,
    @CurrentUser() user: { userId: string },
  ) {
    const enrollment = await this.enrollmentModel.findOne({
      user_id: user.userId,
      course_id: courseId,
    });
    if (!enrollment) {
      throw new ForbiddenException('수강 신청 후 시청할 수 있습니다');
    }

    const episode = await this.episodeModel
      .findOne({ _id: episodeId, course_id: courseId })
      .lean();
    if (!episode) throw new NotFoundException('에피소드를 찾을 수 없습니다');

    const section = await this.sectionModel
      .findById(episode.section_id)
      .select('_id title order')
      .lean();

    return {
      success: true,
      data: {
        _id: episode._id,
        title: episode.title,
        videoUrl: episode.videoUrl,
        duration: episode.duration,
        order: episode.order,
        section,
      },
    };
  }
}
