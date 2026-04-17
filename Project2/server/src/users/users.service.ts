import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../schemas/user.schema';
import {
  UpdateProfileDto,
  ChangePasswordDto,
  UpdateUserRoleDto,
} from './users.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async getMe(userId: string) {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { name: dto.name }, { new: true })
      .select('-password');
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');
    return user;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');
    if (!user.password) {
      throw new UnauthorizedException('소셜 로그인 계정은 비밀번호를 변경할 수 없습니다');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.userModel.findByIdAndUpdate(userId, { password: hashed });

    return { message: '비밀번호가 변경되었습니다.' };
  }

  async findAll(query: { page?: number; limit?: number; role?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const filter = query.role ? { role: query.role } : {};

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateRole(userId: string, dto: UpdateUserRoleDto) {
    const user = await this.userModel
      .findByIdAndUpdate(userId, { role: dto.role }, { new: true })
      .select('_id role')
      .lean();
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');
    return user;
  }
}
