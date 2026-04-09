import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Enrollment, EnrollmentDocument } from '../schemas/enrollment.schema';
import { Course, CourseDocument } from '../schemas/course.schema';
import { Episode, EpisodeDocument } from '../schemas/episode.schema';
import { Progress, ProgressDocument } from '../schemas/progress.schema';

interface PopulatedCourse {
  _id: Types.ObjectId;
  title: string;
  thumbnail: string | null;
  instructor: string;
  examName: string;
}

export interface MyEnrollmentResponse {
  enrollment: {
    _id: Types.ObjectId;
    enrolledAt: Date;
  };
  course: {
    _id: Types.ObjectId;
    title: string;
    thumbnail: string | null;
    instructor: string;
    examName: string;
  };
  progress: {
    completedCount: number;
    totalCount: number;
    percentage: number;
    lastWatchedEpisodeId: Types.ObjectId | null;
  };
}

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Course.name)
    private courseModel: Model<CourseDocument>,
    @InjectModel(Episode.name)
    private episodeModel: Model<EpisodeDocument>,
    @InjectModel(Progress.name)
    private progressModel: Model<ProgressDocument>,
  ) {}

  async enroll(userId: string, courseId: string) {
    const userOid = new Types.ObjectId(userId);
    const courseOid = new Types.ObjectId(courseId);

    // 강의 존재 여부 확인
    const courseExists = await this.courseModel.exists({ _id: courseOid });
    if (!courseExists) {
      throw new NotFoundException('강의를 찾을 수 없습니다');
    }

    const existing = await this.enrollmentModel.findOne({
      user_id: userOid,
      course_id: courseOid,
    });

    if (existing) {
      throw new BadRequestException('이미 수강 신청한 강의입니다');
    }

    const enrollment = await this.enrollmentModel.create({
      user_id: userOid,
      course_id: courseOid,
    });

    return enrollment;
  }

  async getMyEnrollments(userId: string): Promise<MyEnrollmentResponse[]> {
    const userOid = new Types.ObjectId(userId);

    const enrollments = await this.enrollmentModel
      .find({ user_id: userOid })
      .populate<{ course_id: PopulatedCourse }>(
        'course_id',
        'title thumbnail instructor examName',
      )
      .sort({ enrolledAt: -1 })
      .lean();

    const withCourse = enrollments.filter(
      (e): e is (typeof e & { course_id: PopulatedCourse }) =>
        e.course_id != null,
    );

    const result = await Promise.all(
      withCourse.map(async (e) => {
        const course = e.course_id;
        const courseOid = course._id;

        // 총 에피소드 수
        const totalCount = await this.episodeModel.countDocuments({
          course_id: courseOid,
        });

        // 완료한 에피소드 수
        const completedCount = await this.progressModel.countDocuments({
          user_id: userOid,
          course_id: courseOid,
          isCompleted: true,
        });

        // 마지막으로 시청한 에피소드 (가장 최근 watchedAt 기준)
        const lastProgress = await this.progressModel
          .findOne({
            user_id: userOid,
            course_id: courseOid,
          })
          .sort({ watchedAt: -1 })
          .lean();

        const percentage =
          totalCount > 0
            ? Math.round((completedCount / totalCount) * 1000) / 10
            : 0;

        return {
          enrollment: {
            _id: e._id,
            enrolledAt: e.enrolledAt,
          },
          course: {
            _id: course._id,
            title: course.title,
            thumbnail: course.thumbnail ?? null,
            instructor: course.instructor,
            examName: course.examName,
          },
          progress: {
            completedCount,
            totalCount,
            percentage,
            lastWatchedEpisodeId: lastProgress?.episode_id ?? null,
          },
        };
      }),
    );

    return result;
  }

  async checkEnrollment(userId: string, courseId: string) {
    const userOid = new Types.ObjectId(userId);
    const courseOid = new Types.ObjectId(courseId);

    const enrollment = await this.enrollmentModel.findOne({
      user_id: userOid,
      course_id: courseOid,
    });

    return {
      isEnrolled: !!enrollment,
      enrolledAt: enrollment?.enrolledAt ?? null,
    };
  }
}