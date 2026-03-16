import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CourseDocument = Course & Document;

@Schema({ timestamps: true })
export class Course {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: null })
  thumbnail: string;

  @Prop({ required: true })
  instructor: string;

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

  @Prop({ default: 0 })
  totalDuration: number;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
