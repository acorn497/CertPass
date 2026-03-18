import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtGuard } from '../common/jwt.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileSchema, ChangePasswordSchema } from './users.dto';

@Controller('users')
@UseGuards(JwtGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: { userId: string }) {
    const data = await this.usersService.getMe(user.userId);
    return { success: true, data };
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: { userId: string },
    @Body() body: unknown,
  ) {
    const result = UpdateProfileSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.errors[0].message);
    }
    const data = await this.usersService.updateProfile(user.userId, result.data);
    return { success: true, data };
  }

  @Patch('me/password')
  async changePassword(
    @CurrentUser() user: { userId: string },
    @Body() body: unknown,
  ) {
    const result = ChangePasswordSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.errors[0].message);
    }
    const data = await this.usersService.changePassword(user.userId, result.data);
    return { success: true, data };
  }
}
