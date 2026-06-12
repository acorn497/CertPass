import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
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
    const emailVerifyToken = crypto.randomBytes(24).toString('hex');
    const user = await this.userModel.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      emailVerifyToken,
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
        isEmailVerified: user.isEmailVerified,
      },
      token: accessToken,
      refreshToken,
      emailVerifyToken,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    if (!user.password) {
      throw new UnauthorizedException('소셜 로그인 계정입니다');
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
        isEmailVerified: user.isEmailVerified,
      },
      token: accessToken,
      refreshToken,
    };
  }

  async verifyEmail(token: string) {
    const user = await this.userModel.findOneAndUpdate(
      { emailVerifyToken: token },
      { isEmailVerified: true, emailVerifyToken: null },
      { new: true },
    );
    if (!user) throw new BadRequestException('유효하지 않은 인증 토큰입니다');
    return { message: '이메일 인증이 완료되었습니다.' };
  }

  async googleLogin(profile: { oauthId: string; email: string; name: string }) {
    let user = await this.userModel.findOne({
      oauthProvider: 'google',
      oauthId: profile.oauthId,
    });

    if (!user) {
      user = await this.userModel.findOne({ email: profile.email });
    }

    if (!user) {
      user = await this.userModel.create({
        email: profile.email,
        name: profile.name,
        password: null,
        oauthProvider: 'google',
        oauthId: profile.oauthId,
        isEmailVerified: true,
      });
    } else if (!user.oauthProvider) {
      await this.userModel.findByIdAndUpdate(user.id, {
        oauthProvider: 'google',
        oauthId: profile.oauthId,
        isEmailVerified: true,
      });
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
        isEmailVerified: true,
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
    const secret = process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET;
    if (!secret) throw new UnauthorizedException('JWT 시크릿이 설정되지 않았습니다');
    return jwt.sign(
      { sub: userId, email },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '15m' } as jwt.SignOptions,
    );
  }

  private generateRefreshToken(userId: string): string {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new UnauthorizedException('Refresh Token 시크릿이 설정되지 않았습니다');
    }
    return jwt.sign(
      { sub: userId },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' } as jwt.SignOptions,
    );
  }
}
