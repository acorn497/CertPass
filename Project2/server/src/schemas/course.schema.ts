import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CourseDocument = Course & Document;

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
}

export const CourseSchema = SchemaFactory.createForClass(Course);

CourseSchema.index({
  title: 'text',
  description: 'text',
  instructor: 'text',
  examName: 'text',
});
