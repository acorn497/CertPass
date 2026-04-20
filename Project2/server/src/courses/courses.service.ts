import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Course, CourseDocument } from '../schemas/course.schema';
import { Section, SectionDocument } from '../schemas/section.schema';
import { Episode, EpisodeDocument } from '../schemas/episode.schema';
import { Category, CategoryDocument } from '../schemas/category.schema';

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Section.name) private sectionModel: Model<SectionDocument>,
    @InjectModel(Episode.name) private episodeModel: Model<EpisodeDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    category?: string;
    level?: string;
    q?: string;
  }) {
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

    const coursesWithCount = await Promise.all(
      courses.map(async (course) => {
        const episodeCount = await this.episodeModel.countDocuments({
          course_id: course._id,
        });
        return {
          ...course,
          category: course.category_id,
          episodeCount,
        };
      }),
    );

    return {
      courses: coursesWithCount,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(courseId: string) {
    const course = await this.courseModel
      .findById(courseId)
      .populate('category_id', 'name slug')
      .lean();

    if (!course) throw new NotFoundException('강의를 찾을 수 없습니다');

    const sections = await this.sectionModel
      .find({ course_id: course._id })
      .sort({ order: 1 })
      .lean();

    const sectionsWithEpisodes = await Promise.all(
      sections.map(async (section) => {
        const episodes = await this.episodeModel
          .find({ section_id: section._id })
          .sort({ order: 1 })
          .select('_id title duration order')
          .lean();
        return { ...section, episodes };
      }),
    );

    return {
      ...course,
      category: course.category_id,
      sections: sectionsWithEpisodes,
    };
  }

  async create(
    userId: string,
    dto: {
      title: string;
      description: string;
      categoryId: string;
      examName: string;
      level: string;
      thumbnail?: string | null;
    },
  ) {
    const user = await this.userModel.findById(userId).select('name');
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');

    const category = await this.categoryModel.findById(dto.categoryId);
    if (!category) throw new NotFoundException('카테고리를 찾을 수 없습니다');

    return this.courseModel.create({
      title: dto.title,
      description: dto.description,
      thumbnail: dto.thumbnail ?? null,
      instructor: user.name,
      instructor_id: user._id,
      category_id: category._id,
      examName: dto.examName,
      level: dto.level,
      price: 0,
      isPublished: false,
      status: 'pending',
      totalDuration: 0,
    });
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
    return course;
  }

  async remove(userId: string, courseId: string, role: string) {
    const course = await this.assertCourseOwnerOrAdmin(userId, courseId, role);
    if (!['pending', 'rejected'].includes(course.status)) {
      throw new BadRequestException('승인된 강의는 삭제할 수 없습니다');
    }
    await Promise.all([
      this.courseModel.findByIdAndDelete(courseId),
      this.sectionModel.deleteMany({ course_id: course._id }),
      this.episodeModel.deleteMany({ course_id: course._id }),
    ]);
    return { message: '강의가 삭제되었습니다.' };
  }

  async updateStatus(courseId: string, status: 'pending' | 'approved' | 'rejected') {
    const course = await this.courseModel.findByIdAndUpdate(
      courseId,
      { status, isPublished: status === 'approved' },
      { new: true },
    );
    if (!course) throw new NotFoundException('강의를 찾을 수 없습니다');
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
    return { thumbnail: course.thumbnail };
  }

  async createSection(userId: string, courseId: string, role: string, dto: { title: string; order: number }) {
    const course = await this.assertCourseOwnerOrAdmin(userId, courseId, role);
    return this.sectionModel.create({ course_id: course._id, ...dto });
  }

  async updateSection(
    userId: string,
    courseId: string,
    sectionId: string,
    role: string,
    dto: { title?: string; order?: number },
  ) {
    await this.assertCourseOwnerOrAdmin(userId, courseId, role);
    const section = await this.sectionModel.findOneAndUpdate(
      { _id: sectionId, course_id: courseId },
      dto,
      { new: true },
    );
    if (!section) throw new NotFoundException('섹션을 찾을 수 없습니다');
    return section;
  }

  async removeSection(userId: string, courseId: string, sectionId: string, role: string) {
    await this.assertCourseOwnerOrAdmin(userId, courseId, role);
    await Promise.all([
      this.sectionModel.findOneAndDelete({ _id: sectionId, course_id: courseId }),
      this.episodeModel.deleteMany({ section_id: sectionId, course_id: courseId }),
    ]);
    return { message: '섹션이 삭제되었습니다.' };
  }

  async createEpisode(
    userId: string,
    courseId: string,
    sectionId: string,
    role: string,
    dto: { title: string; videoUrl: string; duration: number; order: number },
  ) {
    await this.assertCourseOwnerOrAdmin(userId, courseId, role);
    const section = await this.sectionModel.findOne({ _id: sectionId, course_id: courseId });
    if (!section) throw new NotFoundException('섹션을 찾을 수 없습니다');
    const episode = await this.episodeModel.create({
      section_id: section._id,
      course_id: courseId,
      ...dto,
    });
    await this.recalculateDuration(courseId);
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
    await this.assertCourseOwnerOrAdmin(userId, courseId, role);
    const episode = await this.episodeModel.findOneAndUpdate(
      { _id: episodeId, section_id: sectionId, course_id: courseId },
      dto,
      { new: true },
    );
    if (!episode) throw new NotFoundException('에피소드를 찾을 수 없습니다');
    await this.recalculateDuration(courseId);
    return episode;
  }

  async removeEpisode(
    userId: string,
    courseId: string,
    sectionId: string,
    episodeId: string,
    role: string,
  ) {
    await this.assertCourseOwnerOrAdmin(userId, courseId, role);
    const episode = await this.episodeModel.findOneAndDelete({
      _id: episodeId,
      section_id: sectionId,
      course_id: courseId,
    });
    if (!episode) throw new NotFoundException('에피소드를 찾을 수 없습니다');
    await this.recalculateDuration(courseId);
    return { message: '에피소드가 삭제되었습니다.' };
  }

  private async assertCourseOwnerOrAdmin(userId: string, courseId: string, role: string) {
    const course = await this.courseModel.findById(courseId);
    if (!course) throw new NotFoundException('강의를 찾을 수 없습니다');
    if (role !== 'admin' && String(course.instructor_id) !== userId) {
      throw new ForbiddenException('본인 강의만 수정할 수 있습니다');
    }
    return course;
  }

  private async recalculateDuration(courseId: string) {
    const episodes = await this.episodeModel.find({ course_id: courseId }).select('duration');
    const totalDuration = episodes.reduce((sum, episode) => sum + episode.duration, 0);
    await this.courseModel.findByIdAndUpdate(courseId, { totalDuration });
  }
}
