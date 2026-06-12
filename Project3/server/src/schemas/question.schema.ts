import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuestionDocument = Question & Document;

@Schema({ timestamps: true })
export class Question {
  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  course_id: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ type: [String], required: true })
  options: string[];

  @Prop({ required: true, min: 0, max: 3 })
  answer: number;

  @Prop({ default: '' })
  explanation: string;

  @Prop({ required: true })
  order: number;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
