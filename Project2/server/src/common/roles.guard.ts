import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { ROLES_KEY } from './roles.decorator';
import type { UserRole } from './roles.decorator';
import type { AuthenticatedUser } from './jwt.guard';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
    }>();
    const userId = request.user?.userId;

    if (!userId) {
      throw new UnauthorizedException('인증이 필요합니다');
    }

    const user = await this.userModel.findById(userId).select('role').lean();
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    if (!requiredRoles.includes(user.role as UserRole)) {
      throw new ForbiddenException('접근 권한이 없습니다');
    }

    return true;
  }
}
