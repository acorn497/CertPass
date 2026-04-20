import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from '../schemas/category.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async findAll() {
    return this.categoryModel.find().select('_id name slug');
  }

  async create(dto: { name: string; slug: string }) {
    return this.categoryModel.create(dto);
  }

  async update(categoryId: string, dto: { name?: string; slug?: string }) {
    const category = await this.categoryModel.findByIdAndUpdate(categoryId, dto, {
      new: true,
    });
    if (!category) throw new NotFoundException('카테고리를 찾을 수 없습니다');
    return category;
  }

  async remove(categoryId: string) {
    const category = await this.categoryModel.findByIdAndDelete(categoryId);
    if (!category) throw new NotFoundException('카테고리를 찾을 수 없습니다');
    return { message: '카테고리가 삭제되었습니다.' };
  }
}
