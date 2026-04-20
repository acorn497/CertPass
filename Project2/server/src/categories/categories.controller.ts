import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { z } from 'zod';
import { CategoriesService } from './categories.service';
import { JwtGuard } from '../common/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';

const CategorySchema = z.object({
  name: z.string().min(1, '카테고리명을 입력해주세요'),
  slug: z.string().min(1, 'slug를 입력해주세요'),
});

const UpdateCategorySchema = CategorySchema.partial();

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll() {
    const data = await this.categoriesService.findAll();
    return { success: true, data };
  }

  @Post()
  @Roles('admin')
  @UseGuards(JwtGuard, RolesGuard)
  async create(@Body() body: unknown) {
    const result = CategorySchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.issues[0].message);
    }
    const data = await this.categoriesService.create(result.data);
    return { success: true, data };
  }

  @Patch(':categoryId')
  @Roles('admin')
  @UseGuards(JwtGuard, RolesGuard)
  async update(@Param('categoryId') categoryId: string, @Body() body: unknown) {
    const result = UpdateCategorySchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.issues[0].message);
    }
    const data = await this.categoriesService.update(categoryId, result.data);
    return { success: true, data };
  }

  @Delete(':categoryId')
  @Roles('admin')
  @UseGuards(JwtGuard, RolesGuard)
  async remove(@Param('categoryId') categoryId: string) {
    const data = await this.categoriesService.remove(categoryId);
    return { success: true, data };
  }
}
