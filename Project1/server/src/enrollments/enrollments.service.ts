import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Enrollment, EnrollmentDocument } from '../schemas/enrollment.schema';
import { Course, CourseDocument } from '../schemas/course.schema';
import { Episode, EpisodeDocument } from '../schemas/episode.schema';
import { Progress, ProgressDocument } from '../schemas/progress.schema';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Episode.name) private episodeModel: Model<EpisodeDocument>,
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
  ) {}

  async enroll(userId: string, courseId: string) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('강의를 찾을 수 없습니다');

    const existing = await this.enrollmentModel.findOne({
      user_id: userId,
      course_id: courseId,
    });
    if (existing) {
      throw new BadRequestException('이미 수강 신청한 강의입니다');
    }

    const enrollment = await this.enrollmentModel.create({
      user_id: userId,
      course_id: courseId,
    });

    return enrollment;
  }

  async getMyEnrollments(userId: string) {
    const enrollments = await this.enrollmentModel
      .find({ user_id: userId })
      .populate('course_id', 'title thumbnail instructor examName')
      .sort({ enrolledAt: -1 })
      .lean();

    const result = await Promise.all(
      enrollments.map(async (e) => {
        const totalCount = await this.episodeModel.countDocuments({
          course_id: e.course_id,
        });
        const completedCount = await this.progressModel.countDocuments({
          user_id: userId,
          course_id: e.course_id,
          isCompleted: true,
        });
        const lastProgress = await this.progressModel
          .findOne({ user_id: userId, course_id: e.course_id, isCompleted: true })
          .sort({ watchedAt: -1 })
          .lean();

        return {
          enrollment: { _id: e._id, enrolledAt: e.enrolledAt },
          course: e.course_id,
          progress: {
            completedCount,
            totalCount,
            percentage:
              totalCount > 0
                ? Math.round((completedCount / totalCount) * 1000) / 10
                : 0,
            lastWatchedEpisodeId: lastProgress?.episode_id ?? null,
          },
        };
      }),
    );

    return result;
  }

  async checkEnrollment(userId: string, courseId: string) {
    const enrollment = await this.enrollmentModel.findOne({
      user_id: userId,
      course_id: courseId,
    });

    return {
      isEnrolled: !!enrollment,
      enrolledAt: enrollment?.enrolledAt ?? null,
    };
  }
}
