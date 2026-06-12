import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import type { Request } from 'express';

function accessSecret() {
  return process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET;
}

@Injectable()
export class OptionalJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader) return true;
    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('유효하지 않은 인증 헤더입니다');
    }

    const secret = accessSecret();
    if (!secret) throw new UnauthorizedException('JWT 시크릿이 설정되지 않았습니다');

    try {
      const payload = jwt.verify(authHeader.split(' ')[1], secret) as {
        sub: string;
        email: string;
      };
      (request as any).user = { userId: payload.sub, email: payload.email };
      return true;
    } catch {
      throw new UnauthorizedException('유효하지 않은 토큰입니다');
    }
  }
}
