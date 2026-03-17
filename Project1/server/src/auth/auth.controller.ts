import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterSchema, LoginSchema } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: unknown) {
    const result = RegisterSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.errors[0].message);
    }
    const data = await this.authService.register(result.data);
    return { success: true, data };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: unknown) {
    const result = LoginSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.errors[0].message);
    }
    const data = await this.authService.login(result.data);
    return { success: true, data };
  }
}
