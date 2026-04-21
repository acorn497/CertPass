import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument } from '../schemas/course.schema';
import { Enrollment, EnrollmentDocument } from '../schemas/enrollment.schema';
import { Progress, ProgressDocument } from '../schemas/progress.schema';
import { Episode, EpisodeDocument } from '../schemas/episode.schema';

@Injectable()
export class InstructorService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
    @InjectModel(Episode.name) private episodeModel: Model<EpisodeDocument>,
  ) {}

  async myCourses(userId: string, role: string) {
    const filter = role === 'admin' ? {} : { instructor_id: new Types.ObjectId(userId) };
    const courses = await this.courseModel.find(filter).sort({ createdAt: -1 }).lean();
    return Promise.all(
      courses.map(async (course) => ({
        ...course,
        enrollmentCount: await this.enrollmentModel.countDocuments({
          course_id: course._id,
        }),
      })),
    );
  }

  async stats(userId: string, role: string, courseId: string) {
    const course = await this.courseModel.findById(courseId).lean();
    if (!course) throw new NotFoundException('강의를 찾을 수 없습니다');
    if (role !== 'admin' && String(course.instructor_id) !== userId) {
      throw new ForbiddenException('본인 강의만 조회할 수 있습니다');
    }

    const [enrollmentCount, episodes, completedCount] = await Promise.all([
      this.enrollmentModel.countDocuments({ course_id: course._id }),
      this.episodeModel.find({ course_id: course._id }).select('_id title order').lean(),
      this.progressModel.countDocuments({ course_id: course._id, isCompleted: true }),
    ]);

    const episodeStats = await Promise.all(
      episodes.map(async (episode) => ({
        episode,
        completedCount: await this.progressModel.countDocuments({
          course_id: course._id,
          episode_id: episode._id,
          isCompleted: true,
        }),
        completionRate:
          enrollmentCount > 0
            ? Math.round(
                ((await this.progressModel.countDocuments({
                  course_id: course._id,
                  episode_id: episode._id,
                  isCompleted: true,
                })) /
                  enrollmentCount) *
                  1000,
              ) / 10
            : 0,
      })),
    );

    return {
      course,
      enrollmentCount,
      avgRating: course.avgRating ?? 0,
      reviewCount: course.reviewCount ?? 0,
      totalEpisodes: episodes.length,
      completedCount,
      episodeStats,
    };
  }
}
