import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
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
    const { refreshToken, ...rest } = data;
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
    return { success: true, data: rest };
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
}
