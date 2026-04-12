import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { User, UserDocument } from '../schemas/user.schema';
import { RegisterDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async register(dto: RegisterDto) {
    const exists = await this.userModel.findOne({ email: dto.email });
    if (exists) {
      throw new ConflictException('이미 사용 중인 이메일입니다');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
    });

    const accessToken = this.generateAccessToken(user.id, user.email);
    const refreshToken = this.generateRefreshToken(user.id);
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.userModel.findByIdAndUpdate(user.id, { refreshToken: hashedRefresh });

    return {
      user: {
        _id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token: accessToken,
      refreshToken,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    const accessToken = this.generateAccessToken(user.id, user.email);
    const refreshToken = this.generateRefreshToken(user.id);
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.userModel.findByIdAndUpdate(user.id, { refreshToken: hashedRefresh });

    return {
      user: {
        _id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token: accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { sub: string };
    } catch {
      throw new UnauthorizedException('Refresh Token이 유효하지 않습니다');
    }

    const user = await this.userModel.findById(payload.sub);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Refresh Token이 유효하지 않습니다');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isMatch) {
      throw new UnauthorizedException('Refresh Token이 유효하지 않습니다');
    }

    const newAccessToken = this.generateAccessToken(user.id, user.email);
    const newRefreshToken = this.generateRefreshToken(user.id);
    const hashedRefresh = await bcrypt.hash(newRefreshToken, 10);
    await this.userModel.findByIdAndUpdate(user.id, { refreshToken: hashedRefresh });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, { refreshToken: null });
  }

  private generateAccessToken(userId: string, email: string): string {
    return jwt.sign(
      { sub: userId, email },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '15m' } as jwt.SignOptions,
    );
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { sub: userId },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' } as jwt.SignOptions,
    );
  }
}
