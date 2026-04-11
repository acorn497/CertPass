import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Progress, ProgressDocument } from '../schemas/progress.schema';
import { Enrollment, EnrollmentDocument } from '../schemas/enrollment.schema';
import { Episode, EpisodeDocument } from '../schemas/episode.schema';

@Injectable()
export class ProgressService {
  constructor(
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Episode.name) private episodeModel: Model<EpisodeDocument>,
  ) {}

  async getCourseProgress(userId: string, courseId: string) {
    const userOid = new Types.ObjectId(userId);
    const courseOid = new Types.ObjectId(courseId);

    const [allEpisodes, completedProgresses] = await Promise.all([
      this.episodeModel.find({ course_id: courseOid }).select('_id').lean(),
      this.progressModel
        .find({ user_id: userOid, course_id: courseOid, isCompleted: true })
        .select('episode_id')
        .lean(),
    ]);

    const totalCount = allEpisodes.length;
    const completedCount = completedProgresses.length;

    return {
      courseId,
      completedEpisodeIds: completedProgresses.map((p) => p.episode_id),
      totalCount,
      completedCount,
      percentage:
        totalCount > 0
          ? Math.round((completedCount / totalCount) * 1000) / 10
          : 0,
    };
  }

  async completeEpisode(
    userId: string,
    courseId: string,
    episodeId: string,
  ) {
    const userOid = new Types.ObjectId(userId);
    const courseOid = new Types.ObjectId(courseId);
    const episodeOid = new Types.ObjectId(episodeId);

    const enrollment = await this.enrollmentModel.findOne({
      user_id: userOid,
      course_id: courseOid,
    });
    if (!enrollment) {
      throw new ForbiddenException('수강 신청된 강의가 아닙니다');
    }

    const episode = await this.episodeModel.findById(episodeOid);
    if (!episode) throw new NotFoundException('에피소드를 찾을 수 없습니다');

    const progress = await this.progressModel.findOneAndUpdate(
      { user_id: userOid, episode_id: episodeOid },
      {
        user_id: userOid,
        course_id: courseOid,
        episode_id: episodeOid,
        isCompleted: true,
        watchedAt: new Date(),
      },
      { upsert: true, new: true },
    );

    return progress;
  }
}
