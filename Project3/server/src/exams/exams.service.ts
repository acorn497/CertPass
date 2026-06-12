import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Exam, ExamDocument } from '../schemas/exam.schema';
import { Question, QuestionDocument } from '../schemas/question.schema';
import { ExamAttempt, ExamAttemptDocument } from '../schemas/exam-attempt.schema';
import { Course, CourseDocument } from '../schemas/course.schema';
import { Enrollment, EnrollmentDocument } from '../schemas/enrollment.schema';

@Injectable()
export class ExamsService {
  constructor(
    @InjectModel(Exam.name) private examModel: Model<ExamDocument>,
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    @InjectModel(ExamAttempt.name)
    private attemptModel: Model<ExamAttemptDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
  ) {}

  async findByCourse(userId: string, role: string, courseId: string) {
    await this.assertCourseAccess(userId, role, courseId);
    const exams = await this.examModel.find({ course_id: courseId }).lean();
    return exams.map((exam) => ({
      ...exam,
      questionCount: exam.question_ids?.length ?? 0,
    }));
  }

  async createExam(
    userId: string,
    role: string,
    courseId: string,
    dto: { title: string; description?: string; timeLimit?: number | null; examDate?: Date | null },
  ) {
    await this.assertCourseOwnerOrAdmin(userId, role, courseId);
    return this.examModel.create({
      course_id: new Types.ObjectId(courseId),
      title: dto.title,
      description: dto.description ?? '',
      timeLimit: dto.timeLimit ?? null,
      examDate: dto.examDate ?? null,
      question_ids: [],
    });
  }

  async findQuestions(userId: string, role: string, examId: string) {
    const exam = await this.examModel.findById(examId);
    if (!exam) throw new NotFoundException('모의고사를 찾을 수 없습니다');
    await this.assertCourseAccess(userId, role, String(exam.course_id));
    return this.questionModel
      .find({ _id: { $in: exam.question_ids ?? [] } })
      .select('_id content options order')
      .sort({ order: 1 })
      .lean();
  }

  async createQuestion(
    userId: string,
    role: string,
    examId: string,
    dto: {
      content: string;
      options: string[];
      answer: number;
      explanation?: string;
      order: number;
    },
  ) {
    const exam = await this.examModel.findById(examId);
    if (!exam) throw new NotFoundException('모의고사를 찾을 수 없습니다');
    await this.assertCourseOwnerOrAdmin(userId, role, String(exam.course_id));
    const question = await this.questionModel.create({
      course_id: exam.course_id,
      content: dto.content,
      options: dto.options,
      answer: dto.answer,
      explanation: dto.explanation ?? '',
      order: dto.order,
    });
    exam.question_ids.push(question._id as Types.ObjectId);
    await exam.save();
    return question;
  }

  async submitAttempt(
    userId: string,
    role: string,
    examId: string,
    answers: Array<{ questionId: string; selected: number }>,
  ) {
    const exam = await this.examModel.findById(examId);
    if (!exam) throw new NotFoundException('모의고사를 찾을 수 없습니다');
    await this.assertCourseAccess(userId, role, String(exam.course_id));

    const questions = await this.questionModel
      .find({ _id: { $in: exam.question_ids ?? [] } })
      .lean();
    const answerMap = new Map(answers.map((a) => [a.questionId, a.selected]));
    const results = questions.map((question) => {
      const selected = answerMap.get(String(question._id));
      const isCorrect = selected === question.answer;
      return {
        questionId: question._id,
        selected: selected ?? null,
        answer: question.answer,
        isCorrect,
        explanation: question.explanation,
      };
    });
    const correctCount = results.filter((result) => result.isCorrect).length;
    const totalCount = questions.length;
    const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    const attempt = await this.attemptModel.create({
      user_id: new Types.ObjectId(userId),
      exam_id: exam._id,
      answers: answers.map((answer) => ({
        questionId: new Types.ObjectId(answer.questionId),
        selected: answer.selected,
      })),
      score,
      correctCount,
      totalCount,
    });
    return { ...attempt.toObject(), results };
  }

  async myAttempts(userId: string, examId: string) {
    return this.attemptModel
      .find({ user_id: userId, exam_id: examId })
      .sort({ completedAt: -1 })
      .lean();
  }

  private async assertCourseAccess(userId: string, role: string, courseId: string) {
    if (role === 'admin') return;
    const course = await this.courseModel.findById(courseId).select('instructor_id');
    if (!course) throw new NotFoundException('강의를 찾을 수 없습니다');
    if (String(course.instructor_id) === userId) return;
    const enrollment = await this.enrollmentModel.findOne({
      user_id: new Types.ObjectId(userId),
      course_id: new Types.ObjectId(courseId),
    });
    if (!enrollment) throw new ForbiddenException('수강 중인 강의만 이용할 수 있습니다');
  }

  private async assertCourseOwnerOrAdmin(userId: string, role: string, courseId: string) {
    if (role === 'admin') return;
    const course = await this.courseModel.findById(courseId).select('instructor_id');
    if (!course) throw new NotFoundException('강의를 찾을 수 없습니다');
    if (String(course.instructor_id) !== userId) {
      throw new ForbiddenException('본인 강의만 수정할 수 있습니다');
    }
  }
}
