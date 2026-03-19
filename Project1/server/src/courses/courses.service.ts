import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course, CourseDocument } from '../schemas/course.schema';
import { Section, SectionDocument } from '../schemas/section.schema';
import { Episode, EpisodeDocument } from '../schemas/episode.schema';
import { Category, CategoryDocument } from '../schemas/category.schema';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Section.name) private sectionModel: Model<SectionDocument>,
    @InjectModel(Episode.name) private episodeModel: Model<EpisodeDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    category?: string;
    level?: string;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { isPublished: true };

    if (query.category) {
      const cat = await this.categoryModel.findOne({ slug: query.category });
      if (cat) filter.category_id = cat._id;
    }

    if (query.level) {
      filter.level = query.level;
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
      .find({ course_id: courseId })
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
}
