import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  InstructorApplication,
  InstructorApplicationDocument,
  ApplicationStatus,
} from '../schemas/instructor-application.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { CreateApplicationDto, ReviewApplicationDto } from './instructor-applications.dto';

@Injectable()
export class InstructorApplicationsService {
  constructor(
    @InjectModel(InstructorApplication.name)
    private applicationModel: Model<InstructorApplicationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(userId: string, dto: CreateApplicationDto) {
    const userOid = new Types.ObjectId(userId);

    const user = await this.userModel.findById(userOid).select('role').lean();
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');
    if (user.role !== 'student') {
      throw new BadRequestException('이미 강사 또는 관리자 권한을 가지고 있습니다');
    }

    const pending = await this.applicationModel.findOne({
      user_id: userOid,
      status: 'pending',
    });
    if (pending) {
      throw new ConflictException('이미 처리 대기 중인 신청이 있습니다');
    }

    return this.applicationModel.create({
      user_id: userOid,
      motivation: dto.motivation,
    });
  }

  // 본인의 가장 최근 신청 1건
  async findMine(userId: string) {
    return this.applicationModel
      .findOne({ user_id: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  // 관리자: 상태별 목록
  async findAll(status?: ApplicationStatus) {
    const filter = status ? { status } : {};
    const applications = await this.applicationModel
      .find(filter)
      .populate('user_id', '_id name email')
      .sort({ createdAt: -1 })
      .lean();

    return applications.map((app) => ({
      ...app,
      user: app.user_id,
    }));
  }

  // 관리자: 승인 → 신청자의 role을 instructor로 변경
  async approve(applicationId: string, adminId: string, dto: ReviewApplicationDto) {
    const application = await this.getPendingOrThrow(applicationId);

    await this.userModel.findByIdAndUpdate(application.user_id, {
      role: 'instructor',
    });

    application.status = 'approved';
    application.reviewNote = dto.reviewNote ?? null;
    application.reviewedBy = new Types.ObjectId(adminId);
    application.reviewedAt = new Date();
    await application.save();
    return application;
  }

  // 관리자: 거절
  async reject(applicationId: string, adminId: string, dto: ReviewApplicationDto) {
    const application = await this.getPendingOrThrow(applicationId);

    application.status = 'rejected';
    application.reviewNote = dto.reviewNote ?? null;
    application.reviewedBy = new Types.ObjectId(adminId);
    application.reviewedAt = new Date();
    await application.save();
    return application;
  }

  private async getPendingOrThrow(applicationId: string) {
    const application = await this.applicationModel.findById(applicationId);
    if (!application) throw new NotFoundException('신청을 찾을 수 없습니다');
    if (application.status !== 'pending') {
      throw new ConflictException('이미 처리된 신청입니다');
    }
    return application;
  }
}
