import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Course, CourseDocument } from '../schemas/course.schema';
import { Enrollment, EnrollmentDocument } from '../schemas/enrollment.schema';
import { Review, ReviewDocument } from '../schemas/review.schema';
import { QnaPost, QnaPostDocument } from '../schemas/qna-post.schema';
import { QnaComment, QnaCommentDocument } from '../schemas/qna-comment.schema';
import { Progress, ProgressDocument } from '../schemas/progress.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(QnaPost.name) private postModel: Model<QnaPostDocument>,
    @InjectModel(QnaComment.name) private commentModel: Model<QnaCommentDocument>,
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
  ) {}

  async stats() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const [totalUsers, totalCourses, pendingCourses, todayEnrollments] =
      await Promise.all([
        this.userModel.countDocuments(),
        this.courseModel.countDocuments(),
        this.courseModel.countDocuments({ status: 'pending' }),
        this.enrollmentModel.countDocuments({ enrolledAt: { $gte: start } }),
      ]);
    return { totalUsers, totalCourses, pendingCourses, todayEnrollments };
  }

  async courses() {
    const courses = await this.courseModel
      .find()
      .populate('instructor_id', '_id email name')
      .sort({ createdAt: -1 })
      .lean();
    return courses.map((course) => ({
      ...course,
      instructorAccount: course.instructor_id,
    }));
  }

  async moderation() {
    const [qnaPosts, qnaComments, reviews] = await Promise.all([
      this.postModel
        .find()
        .populate('user_id', '_id email name')
        .populate('course_id', '_id title')
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
      this.commentModel
        .find()
        .populate('user_id', '_id email name')
        .populate('post_id', '_id title')
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
      this.reviewModel
        .find()
        .populate('user_id', '_id email name')
        .populate('course_id', '_id title')
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
    ]);

    return {
      qnaPosts: qnaPosts.map((post) => ({
        ...post,
        user: post.user_id,
        course: post.course_id,
      })),
      qnaComments: qnaComments.map((comment) => ({
        ...comment,
        user: comment.user_id,
        post: comment.post_id,
      })),
      reviews: reviews.map((review) => ({
        ...review,
        user: review.user_id,
        course: review.course_id,
      })),
    };
  }

  async removeCourse(courseId: string) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('강의를 찾을 수 없습니다');
    const posts = await this.postModel.find({ course_id: course._id }).select('_id').lean();
    await Promise.all([
      this.courseModel.findByIdAndDelete(courseId),
      this.enrollmentModel.deleteMany({ course_id: course._id }),
      this.reviewModel.deleteMany({ course_id: course._id }),
      this.postModel.deleteMany({ course_id: course._id }),
      this.commentModel.deleteMany({ post_id: { $in: posts.map((post) => post._id) } }),
      this.progressModel.deleteMany({ course_id: course._id }),
    ]);
    return { message: '강의가 삭제되었습니다.' };
  }

  async removeQnaPost(postId: string) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('질문을 찾을 수 없습니다');
    await Promise.all([
      this.postModel.findByIdAndDelete(postId),
      this.commentModel.deleteMany({ post_id: post._id }),
    ]);
    return { message: 'Q&A가 삭제되었습니다.' };
  }

  async removeQnaComment(commentId: string) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다');
    await comment.deleteOne();
    return { message: '댓글이 삭제되었습니다.' };
  }

  async removeReview(reviewId: string) {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) throw new NotFoundException('리뷰를 찾을 수 없습니다');
    const courseId = review.course_id;
    await review.deleteOne();
    await this.recalculateCourseRating(courseId);
    return { message: '리뷰가 삭제되었습니다.' };
  }

  private async recalculateCourseRating(courseId: Types.ObjectId) {
    const result = await this.reviewModel.aggregate([
      { $match: { course_id: courseId } },
      {
        $group: {
          _id: '$course_id',
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);
    await this.courseModel.findByIdAndUpdate(courseId, {
      avgRating: result[0]?.avgRating ? Math.round(result[0].avgRating * 10) / 10 : 0,
      reviewCount: result[0]?.reviewCount ?? 0,
    });
  }
}
