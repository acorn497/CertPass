import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Course, CourseDocument, CourseSection } from '../schemas/course.schema';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { CacheService } from '../common/cache.service';

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly cache: CacheService,
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    category?: string;
    level?: string;
    q?: string;
  }) {
    const cacheKey = `courses:list:${JSON.stringify(query)}`;
    const cached = this.cache.get<unknown>(cacheKey);
    if (cached) return cached;

    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      isPublished: true,
      status: 'approved',
    };

    if (query.category) {
      const cat = await this.categoryModel.findOne({ slug: query.category });
      if (cat) filter.category_id = cat._id;
    }

    if (query.level) {
      filter.level = query.level;
    }

    const keyword = query.q?.trim();
    if (keyword) {
      const safe = escapeRegex(keyword);
      filter.$or = [
        { title: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
        { instructor: { $regex: safe, $options: 'i' } },
        { examName: { $regex: safe, $options: 'i' } },
      ];
    }

    const [courses, total] = await Promise.all([
      this.courseModel
        .find(filter)
        .populate('category_id', 'name slug')
        .skip(skip)
        .limit(limit)
        .lean(),
      this.courseModel.countDocuments(filter),
    ]);

    const result = {
      courses: courses.map((course) => ({
        ...course,
        category: course.category_id,
        episodeCount: this.countEpisodes(course.sections ?? []),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
    this.cache.set(cacheKey, result, 30);
    return result;
  }

  async findOne(courseId: string, userId?: string) {
    const cacheKey = `courses:detail:${courseId}:${userId ?? 'public'}`;
    const cached = this.cache.get<unknown>(cacheKey);
    if (cached) return cached;

    const course = await this.courseModel
      .findById(courseId)
      .populate('category_id', 'name slug')
      .lean();

    if (!course) throw new NotFoundException('강의를 찾을 수 없습니다');
    const canViewHidden = await this.canViewHiddenCourse(course, userId);
    if ((!course.isPublished || course.status !== 'approved') && !canViewHidden) {
      throw new NotFoundException('강의를 찾을 수 없습니다');
    }

    const result = {
      ...course,
      category: course.category_id,
      sections: this.sortSections(course.sections ?? []),
    };
    this.cache.set(cacheKey, result, 60);
    return result;
  }

  async create(
    userId: string,
    dto: {
      title: string;
      description: string;
      categoryId: string;
      examName: string;
      level: string;
      price?: number;
      thumbnail?: string | null;
    },
  ) {
    const user = await this.userModel.findById(userId).select('name');
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');

    const category = await this.categoryModel.findById(dto.categoryId);
    if (!category) throw new NotFoundException('카테고리를 찾을 수 없습니다');

    const course = await this.courseModel.create({
      title: dto.title,
      description: dto.description,
      thumbnail: dto.thumbnail ?? null,
      instructor: user.name,
      instructor_id: user._id,
      category_id: category._id,
      examName: dto.examName,
      level: dto.level,
      price: dto.price ?? 0,
      isPublished: false,
      status: 'pending',
      totalDuration: 0,
      sections: [],
    });
    this.invalidateCourseCache();
    return course;
  }

  async update(
    userId: string,
    courseId: string,
    role: string,
    dto: Partial<{
      title: string;
      description: string;
      categoryId: string;
      examName: string;
      level: string;
      price: number;
      thumbnail: string | null;
    }>,
  ) {
    await this.assertCourseOwnerOrAdmin(userId, courseId, role);
    const update: Record<string, unknown> = { ...dto };
    if (dto.categoryId) {
      update.category_id = dto.categoryId;
      delete update.categoryId;
    }
    const course = await this.courseModel.findByIdAndUpdate(courseId, update, {
      new: true,
    });
    if (!course) throw new NotFoundException('강의를 찾을 수 없습니다');
    this.invalidateCourseCache(courseId);
    return course;
  }

  async remove(userId: string, courseId: string, role: string) {
    const course = await this.assertCourseOwnerOrAdmin(userId, courseId, role);
    if (!['pending', 'rejected'].includes(course.status)) {
      throw new BadRequestException('승인된 강의는 삭제할 수 없습니다');
    }
    await this.courseModel.findByIdAndDelete(courseId);
    this.invalidateCourseCache(courseId);
    return { message: '강의가 삭제되었습니다.' };
  }

  async resubmit(userId: string, courseId: string, role: string) {
    const course = await this.assertCourseOwnerOrAdmin(userId, courseId, role);
    if (course.status !== 'rejected') {
      throw new BadRequestException('반려된 강의만 다시 신청할 수 있습니다');
    }
    course.status = 'pending';
    await course.save();
    this.invalidateCourseCache(courseId);
    return course;
  }

  async updateStatus(courseId: string, status: 'pending' | 'approved' | 'rejected') {
    const course = await this.courseModel.findByIdAndUpdate(
      courseId,
      { status, isPublished: status === 'approved' },
      { new: true },
    );
    if (!course) throw new NotFoundException('강의를 찾을 수 없습니다');
    this.invalidateCourseCache(courseId);
    return course;
  }

  async updateThumbnail(userId: string, courseId: string, role: string, thumbnail: string) {
    await this.assertCourseOwnerOrAdmin(userId, courseId, role);
    const course = await this.courseModel.findByIdAndUpdate(
      courseId,
      { thumbnail },
      { new: true },
    );
    if (!course) throw new NotFoundException('강의를 찾을 수 없습니다');
    this.invalidateCourseCache(courseId);
    return { thumbnail: course.thumbnail };
  }

  async createSection(
    userId: string,
    courseId: string,
    role: string,
    dto: { title: string; order: number },
  ) {
    const course = await this.assertCourseOwnerOrAdmin(userId, courseId, role);
    const section = { _id: new Types.ObjectId(), ...dto, episodes: [] };
    course.sections.push(section);
    await course.save();
    this.invalidateCourseCache(courseId);
    return section;
  }

  async updateSection(
    userId: string,
    courseId: string,
    sectionId: string,
    role: string,
    dto: { title?: string; order?: number },
  ) {
    const course = await this.assertCourseOwnerOrAdmin(userId, courseId, role);
    const section = this.findSection(course, sectionId);
    if (!section) throw new NotFoundException('섹션을 찾을 수 없습니다');
    Object.assign(section, dto);
    await course.save();
    this.invalidateCourseCache(courseId);
    return section;
  }

  async removeSection(userId: string, courseId: string, sectionId: string, role: string) {
    const course = await this.assertCourseOwnerOrAdmin(userId, courseId, role);
    const before = course.sections.length;
    course.sections = course.sections.filter((section) => String(section._id) !== sectionId);
    if (course.sections.length === before) throw new NotFoundException('섹션을 찾을 수 없습니다');
    this.updateDuration(course);
    await course.save();
    this.invalidateCourseCache(courseId);
    return { message: '섹션이 삭제되었습니다.' };
  }

  async createEpisode(
    userId: string,
    courseId: string,
    sectionId: string,
    role: string,
    dto: { title: string; videoUrl: string; duration: number; order: number },
  ) {
    const course = await this.assertCourseOwnerOrAdmin(userId, courseId, role);
    const section = this.findSection(course, sectionId);
    if (!section) throw new NotFoundException('섹션을 찾을 수 없습니다');
    const episode = { _id: new Types.ObjectId(), ...dto };
    section.episodes.push(episode);
    this.updateDuration(course);
    await course.save();
    this.invalidateCourseCache(courseId);
    return episode;
  }

  async updateEpisode(
    userId: string,
    courseId: string,
    sectionId: string,
    episodeId: string,
    role: string,
    dto: Partial<{ title: string; videoUrl: string; duration: number; order: number }>,
  ) {
    const course = await this.assertCourseOwnerOrAdmin(userId, courseId, role);
    const section = this.findSection(course, sectionId);
    if (!section) throw new NotFoundException('섹션을 찾을 수 없습니다');
    const episode = section.episodes.find((ep) => String(ep._id) === episodeId);
    if (!episode) throw new NotFoundException('에피소드를 찾을 수 없습니다');
    Object.assign(episode, dto);
    this.updateDuration(course);
    await course.save();
    this.invalidateCourseCache(courseId);
    return episode;
  }

  async removeEpisode(
    userId: string,
    courseId: string,
    sectionId: string,
    episodeId: string,
    role: string,
  ) {
    const course = await this.assertCourseOwnerOrAdmin(userId, courseId, role);
    const section = this.findSection(course, sectionId);
    if (!section) throw new NotFoundException('섹션을 찾을 수 없습니다');
    const before = section.episodes.length;
    section.episodes = section.episodes.filter((episode) => String(episode._id) !== episodeId);
    if (section.episodes.length === before) {
      throw new NotFoundException('에피소드를 찾을 수 없습니다');
    }
    this.updateDuration(course);
    await course.save();
    this.invalidateCourseCache(courseId);
    return { message: '에피소드가 삭제되었습니다.' };
  }

  private invalidateCourseCache(courseId?: string) {
    this.cache.deleteByPrefix('courses:list:');
    if (courseId) this.cache.deleteByPrefix(`courses:detail:${courseId}`);
  }

  private async assertCourseOwnerOrAdmin(userId: string, courseId: string, role: string) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('강의를 찾을 수 없습니다');
    if (role !== 'admin' && String(course.instructor_id) !== userId) {
      throw new ForbiddenException('본인 강의만 수정할 수 있습니다');
    }
    return course;
  }

  private async canViewHiddenCourse(
    course: Pick<CourseDocument, 'instructor_id' | 'isPublished' | 'status'>,
    userId?: string,
  ) {
    if (course.isPublished && course.status === 'approved') return true;
    if (!userId) return false;
    if (String(course.instructor_id) === userId) return true;
    const user = await this.userModel.findById(userId).select('role').lean();
    return user?.role === 'admin';
  }

  private findSection(course: CourseDocument, sectionId: string) {
    return course.sections.find((section) => String(section._id) === sectionId);
  }

  private updateDuration(course: CourseDocument) {
    course.totalDuration = this.countDuration(course.sections);
  }

  private countEpisodes(sections: Pick<CourseSection, 'episodes'>[]) {
    return sections.reduce((sum, section) => sum + (section.episodes?.length ?? 0), 0);
  }

  private countDuration(sections: CourseSection[]) {
    return sections.reduce(
      (sum, section) =>
        sum + section.episodes.reduce((episodeSum, episode) => episodeSum + episode.duration, 0),
      0,
    );
  }

  private sortSections<T extends { order: number; episodes?: { order: number }[] }>(
    sections: T[],
  ) {
    return [...sections]
      .sort((a, b) => a.order - b.order)
      .map((section) => ({
        ...section,
        episodes: [...(section.episodes ?? [])].sort((a, b) => a.order - b.order),
      }));
  }
}
