import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterSchema, LoginSchema } from './auth.dto';
import { JwtGuard } from '../common/jwt.guard';
import { CurrentUser } from '../common/current-user.decorator';

const REFRESH_COOKIE = 'refreshToken';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const result = RegisterSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.issues[0].message);
    }
    const data = await this.authService.register(result.data);
    const { refreshToken, emailVerifyToken, ...rest } = data;
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
    return {
      success: true,
      data: {
        ...rest,
        message: '인증 이메일이 발송되었습니다.',
        devVerifyUrl: `/api/v1/auth/verify-email?token=${emailVerifyToken}`,
      },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const result = LoginSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.issues[0].message);
    }
    const data = await this.authService.login(result.data);
    const { refreshToken, ...rest } = data;
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
    return { success: true, data: rest };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!token) {
      throw new UnauthorizedException('Refresh Token이 없습니다');
    }
    const data = await this.authService.refresh(token);
    res.cookie(REFRESH_COOKIE, data.refreshToken, COOKIE_OPTIONS);
    return { success: true, data: { token: data.accessToken } };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  async logout(
    @CurrentUser() user: { userId: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.userId);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
    return { success: true, data: { message: '로그아웃되었습니다.' } };
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token?: string) {
    if (!token) throw new BadRequestException('인증 토큰이 필요합니다');
    const data = await this.authService.verifyEmail(token);
    return { success: true, data };
  }

  @Get('google')
  async google() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ??
      'http://localhost:3000/api/v1/auth/google/callback';

    if (!clientId) {
      return {
        success: true,
        data: {
          message: 'GOOGLE_CLIENT_ID가 없어서 개발용 콜백을 사용하세요.',
          devCallback:
            '/api/v1/auth/google/callback?email=google@example.com&name=Google%20User&sub=dev-google-user',
        },
      };
    }

    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', Math.random().toString(36).slice(2));
    return { success: true, data: { url: url.toString() } };
  }

  @Get('google/callback')
  async googleCallback(
    @Query('sub') sub: string | undefined,
    @Query('email') email: string | undefined,
    @Query('name') name: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!sub || !email || !name) {
      throw new BadRequestException('개발용 콜백에는 sub, email, name이 필요합니다');
    }
    const data = await this.authService.googleLogin({
      oauthId: sub,
      email,
      name,
    });
    const { refreshToken, ...rest } = data;
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
    return { success: true, data: rest };
  }
}
