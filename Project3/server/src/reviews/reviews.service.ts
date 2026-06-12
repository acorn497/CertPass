import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from '../schemas/review.schema';
import { Course, CourseDocument } from '../schemas/course.schema';
import { Enrollment, EnrollmentDocument } from '../schemas/enrollment.schema';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
  ) {}

  async findByCourse(courseId: string, page = 1, limit = 10) {
    const courseOid = new Types.ObjectId(courseId);
    const skip = (page - 1) * limit;
    const [reviews, total, course] = await Promise.all([
      this.reviewModel
        .find({ course_id: courseOid })
        .populate('user_id', '_id name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.reviewModel.countDocuments({ course_id: courseOid }),
      this.courseModel.findById(courseOid).select('avgRating reviewCount').lean(),
    ]);

    if (!course) throw new NotFoundException('강의를 찾을 수 없습니다');

    return {
      reviews: reviews.map((review) => ({
        ...review,
        user: review.user_id,
      })),
      avgRating: course.avgRating ?? 0,
      reviewCount: course.reviewCount ?? 0,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(userId: string, courseId: string, dto: { rating: number; content: string }) {
    const userOid = new Types.ObjectId(userId);
    const courseOid = new Types.ObjectId(courseId);
    const enrollment = await this.enrollmentModel.findOne({
      user_id: userOid,
      course_id: courseOid,
    });
    if (!enrollment) {
      throw new ForbiddenException('수강 중인 강의에만 리뷰를 작성할 수 있습니다');
    }

    const exists = await this.reviewModel.findOne({
      user_id: userOid,
      course_id: courseOid,
    });
    if (exists) throw new ConflictException('이미 리뷰를 작성하셨습니다');

    const review = await this.reviewModel.create({
      user_id: userOid,
      course_id: courseOid,
      rating: dto.rating,
      content: dto.content,
    });
    await this.recalculate(courseId);
    return review;
  }

  async update(userId: string, courseId: string, reviewId: string, dto: { rating?: number; content?: string }) {
    const review = await this.reviewModel.findOne({
      _id: reviewId,
      course_id: courseId,
    });
    if (!review) throw new NotFoundException('리뷰를 찾을 수 없습니다');
    if (String(review.user_id) !== userId) {
      throw new ForbiddenException('본인 리뷰만 수정할 수 있습니다');
    }
    Object.assign(review, dto);
    await review.save();
    await this.recalculate(courseId);
    return review;
  }

  async remove(userId: string, role: string, courseId: string, reviewId: string) {
    const review = await this.reviewModel.findOne({
      _id: reviewId,
      course_id: courseId,
    });
    if (!review) throw new NotFoundException('리뷰를 찾을 수 없습니다');
    if (role !== 'admin' && String(review.user_id) !== userId) {
      throw new ForbiddenException('본인 리뷰만 삭제할 수 있습니다');
    }
    await review.deleteOne();
    await this.recalculate(courseId);
    return { message: '리뷰가 삭제되었습니다.' };
  }

  private async recalculate(courseId: string) {
    const courseOid = new Types.ObjectId(courseId);
    const result = await this.reviewModel.aggregate([
      { $match: { course_id: courseOid } },
      { $group: { _id: '$course_id', avgRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
    ]);
    const avgRating = result[0]?.avgRating ? Math.round(result[0].avgRating * 10) / 10 : 0;
    const reviewCount = result[0]?.reviewCount ?? 0;
    await this.courseModel.findByIdAndUpdate(courseOid, { avgRating, reviewCount });
  }
}
