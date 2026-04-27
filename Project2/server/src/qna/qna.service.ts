import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QnaPost, QnaPostDocument } from '../schemas/qna-post.schema';
import { QnaComment, QnaCommentDocument } from '../schemas/qna-comment.schema';
import { Enrollment, EnrollmentDocument } from '../schemas/enrollment.schema';
import { Course, CourseDocument } from '../schemas/course.schema';

@Injectable()
export class QnaService {
  constructor(
    @InjectModel(QnaPost.name) private postModel: Model<QnaPostDocument>,
    @InjectModel(QnaComment.name) private commentModel: Model<QnaCommentDocument>,
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
  ) {}

  async findByCourse(userId: string, courseId: string, page = 1, limit = 10) {
    await this.assertCourseAccess(userId, courseId);
    const skip = (page - 1) * limit;
    const filter = { course_id: new Types.ObjectId(courseId) };
    const [posts, total] = await Promise.all([
      this.postModel
        .find(filter)
        .populate('user_id', '_id name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.postModel.countDocuments(filter),
    ]);

    const comments = await this.commentModel
      .find({ post_id: { $in: posts.map((post) => post._id) } })
      .populate('user_id', '_id name role')
      .sort({ createdAt: 1 })
      .lean();
    const commentsByPostId = comments.reduce<Record<string, typeof comments>>(
      (acc, comment) => {
        const postId = String(comment.post_id);
        acc[postId] = acc[postId] ?? [];
        acc[postId].push(comment);
        return acc;
      },
      {},
    );

    return {
      posts: posts.map((post) => ({
        ...post,
        user: post.user_id,
        comments: (commentsByPostId[String(post._id)] ?? []).map((comment) => ({
          ...comment,
          user: comment.user_id,
        })),
      })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(userId: string, courseId: string, dto: { title: string; content: string }) {
    await this.assertCourseAccess(userId, courseId);
    return this.postModel.create({
      user_id: new Types.ObjectId(userId),
      course_id: new Types.ObjectId(courseId),
      title: dto.title,
      content: dto.content,
    });
  }

  async findOne(userId: string, postId: string) {
    const post = await this.postModel
      .findById(postId)
      .populate('user_id', '_id name role')
      .lean();
    if (!post) throw new NotFoundException('질문을 찾을 수 없습니다');
    await this.assertCourseAccess(userId, String(post.course_id));
    const comments = await this.commentModel
      .find({ post_id: post._id })
      .populate('user_id', '_id name role')
      .sort({ createdAt: 1 })
      .lean();
    return {
      ...post,
      user: post.user_id,
      comments: comments.map((comment) => ({ ...comment, user: comment.user_id })),
    };
  }

  async addComment(userId: string, role: string, postId: string, content: string) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('질문을 찾을 수 없습니다');
    await this.assertCourseAccess(userId, String(post.course_id));
    const isInstructor = await this.isCourseInstructor(userId, String(post.course_id), role);
    const comment = await this.commentModel.create({
      post_id: post._id,
      user_id: new Types.ObjectId(userId),
      content,
      isInstructor,
    });
    if (isInstructor) {
      await this.postModel.findByIdAndUpdate(post._id, { isResolved: true });
    }
    return comment;
  }

  async update(userId: string, postId: string, dto: { title?: string; content?: string }) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('질문을 찾을 수 없습니다');
    if (String(post.user_id) !== userId) {
      throw new ForbiddenException('본인 질문만 수정할 수 있습니다');
    }
    Object.assign(post, dto);
    await post.save();
    return post;
  }

  async remove(userId: string, role: string, postId: string) {
    const post = await this.postModel.findById(postId);
    if (!post) throw new NotFoundException('질문을 찾을 수 없습니다');
    if (role !== 'admin' && String(post.user_id) !== userId) {
      throw new ForbiddenException('본인 질문만 삭제할 수 있습니다');
    }
    await Promise.all([
      this.postModel.findByIdAndDelete(postId),
      this.commentModel.deleteMany({ post_id: post._id }),
    ]);
    return { message: '질문이 삭제되었습니다.' };
  }

  private async assertCourseAccess(userId: string, courseId: string) {
    const course = await this.courseModel.findById(courseId).select('instructor_id');
    if (!course) throw new NotFoundException('강의를 찾을 수 없습니다');
    if (String(course.instructor_id) === userId) return;
    const enrollment = await this.enrollmentModel.findOne({
      user_id: new Types.ObjectId(userId),
      course_id: new Types.ObjectId(courseId),
    });
    if (!enrollment) throw new ForbiddenException('수강 중인 강의 Q&A만 이용할 수 있습니다');
  }

  private async isCourseInstructor(userId: string, courseId: string, role: string) {
    if (role === 'admin') return true;
    const course = await this.courseModel.findById(courseId).select('instructor_id');
    return String(course?.instructor_id) === userId;
  }
}
