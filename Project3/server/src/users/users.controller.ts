import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtGuard } from '../common/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { UsersService } from './users.service';
import {
  UpdateProfileSchema,
  ChangePasswordSchema,
  UpdateUserRoleSchema,
} from './users.dto';

@Controller('users')
@UseGuards(JwtGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('admin')
  @UseGuards(RolesGuard)
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: string,
  ) {
    const data = await this.usersService.findAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      role,
    });
    return { success: true, data };
  }

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
      throw new BadRequestException(result.error.issues[0].message);
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
      throw new BadRequestException(result.error.issues[0].message);
    }
    const data = await this.usersService.changePassword(user.userId, result.data);
    return { success: true, data };
  }

  @Patch(':userId/role')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async updateRole(
    @Param('userId') userId: string,
    @Body() body: unknown,
  ) {
    const result = UpdateUserRoleSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.issues[0].message);
    }
    const data = await this.usersService.updateRole(userId, result.data);
    return { success: true, data };
  }
}
