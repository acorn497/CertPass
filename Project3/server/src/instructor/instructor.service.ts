import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument } from '../schemas/course.schema';
import { Enrollment, EnrollmentDocument } from '../schemas/enrollment.schema';
import { Progress, ProgressDocument } from '../schemas/progress.schema';
import { QnaPost, QnaPostDocument } from '../schemas/qna-post.schema';
import { QnaComment, QnaCommentDocument } from '../schemas/qna-comment.schema';

@Injectable()
export class InstructorService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
    @InjectModel(QnaPost.name) private postModel: Model<QnaPostDocument>,
    @InjectModel(QnaComment.name) private commentModel: Model<QnaCommentDocument>,
  ) {}

  async myCourses(userId: string, role: string) {
    const filter = role === 'admin' ? {} : { instructor_id: new Types.ObjectId(userId) };
    const courses = await this.courseModel.find(filter).sort({ createdAt: -1 }).lean();
    const counts = await this.enrollmentModel.aggregate<{
      _id: Types.ObjectId;
      count: number;
    }>([
      { $match: { course_id: { $in: courses.map((course) => course._id) } } },
      { $group: { _id: '$course_id', count: { $sum: 1 } } },
    ]);
    const countByCourseId = new Map(
      counts.map((item) => [String(item._id), item.count]),
    );
    return courses.map((course) => ({
      ...course,
      enrollmentCount: countByCourseId.get(String(course._id)) ?? 0,
    }));
  }

  async stats(userId: string, role: string, courseId: string) {
    const course = await this.courseModel.findById(courseId).lean();
    if (!course) throw new NotFoundException('강의를 찾을 수 없습니다');
    if (role !== 'admin' && String(course.instructor_id) !== userId) {
      throw new ForbiddenException('본인 강의만 조회할 수 있습니다');
    }

    const [enrollmentCount, episodes, completedCount] = await Promise.all([
      this.enrollmentModel.countDocuments({ course_id: course._id }),
      Promise.resolve((course.sections ?? []).flatMap((section) => section.episodes ?? [])),
      this.progressModel.countDocuments({ course_id: course._id, isCompleted: true }),
    ]);

    const episodeStats = await Promise.all(
      episodes.map(async (episode) => {
        const episodeCompletedCount = await this.progressModel.countDocuments({
          course_id: course._id,
          episode_id: episode._id,
          isCompleted: true,
        });
        return {
          episode,
          completedCount: episodeCompletedCount,
          completionRate:
            enrollmentCount > 0
              ? Math.round((episodeCompletedCount / enrollmentCount) * 1000) / 10
              : 0,
        };
      }),
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

  async unansweredQuestions(userId: string, role: string) {
    const courseFilter = role === 'admin' ? {} : { instructor_id: new Types.ObjectId(userId) };
    const courses = await this.courseModel.find(courseFilter).select('_id title').lean();
    const courseIds = courses.map((course) => course._id);
    const courseById = new Map(courses.map((course) => [String(course._id), course]));

    // 강사/관리자가 이미 답변한 질문은 제외 (isResolved 플래그가 아니라
    // 실제 강사 댓글 존재 여부로 "응답해야 할 질문"을 판단)
    const answeredPostIds = await this.commentModel.distinct('post_id', {
      isInstructor: true,
    });

    const posts = await this.postModel
      .find({ course_id: { $in: courseIds }, _id: { $nin: answeredPostIds } })
      .populate('user_id', '_id name email')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const commentCounts = await this.commentModel.aggregate([
      { $match: { post_id: { $in: posts.map((post) => post._id) } } },
      { $group: { _id: '$post_id', count: { $sum: 1 } } },
    ]);
    const countByPostId = new Map(
      commentCounts.map((item: { _id: Types.ObjectId; count: number }) => [
        String(item._id),
        item.count,
      ]),
    );

    return posts.map((post) => ({
      ...post,
      user: post.user_id,
      course: courseById.get(String(post.course_id)),
      commentCount: countByPostId.get(String(post._id)) ?? 0,
    }));
  }
}
