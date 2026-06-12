import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type CourseDocument = Course & Document;

export interface CourseEpisode {
  _id: Types.ObjectId;
  title: string;
  videoUrl: string;
  duration: number;
  order: number;
}

export interface CourseSection {
  _id: Types.ObjectId;
  title: string;
  order: number;
  episodes: CourseEpisode[];
}

const EpisodeSubSchema = new MongooseSchema(
  {
    title: { type: String, required: true },
    videoUrl: { type: String, required: true },
    duration: { type: Number, required: true },
    order: { type: Number, required: true },
  },
  { _id: true },
);

const SectionSubSchema = new MongooseSchema(
  {
    title: { type: String, required: true },
    order: { type: Number, required: true },
    episodes: { type: [EpisodeSubSchema], default: [] },
  },
  { _id: true },
);

@Schema({ timestamps: true })
export class Course {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String, default: null })
  thumbnail: string | null;

  @Prop({ required: true })
  instructor: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  instructor_id: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category_id: Types.ObjectId;

  @Prop({ required: true })
  examName: string;

  @Prop({ required: true, enum: ['beginner', 'intermediate', 'advanced'] })
  level: string;

  @Prop({ required: true, default: 0 })
  price: number;

  @Prop({ default: false })
  isPublished: boolean;

  @Prop({ default: 'approved', enum: ['pending', 'approved', 'rejected'] })
  status: string;

  @Prop({ default: 0 })
  totalDuration: number;

  @Prop({ default: 0 })
  avgRating: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({ type: [SectionSubSchema], default: [] })
  sections: CourseSection[];
}

export const CourseSchema = SchemaFactory.createForClass(Course);

CourseSchema.index({
  title: 'text',
  description: 'text',
  instructor: 'text',
  examName: 'text',
});
CourseSchema.index({ status: 1, isPublished: 1, createdAt: -1 });
CourseSchema.index({ instructor_id: 1, createdAt: -1 });
CourseSchema.index({ category_id: 1, level: 1, status: 1 });
