import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QnaPostDocument = QnaPost & Document;

@Schema({ timestamps: true })
export class QnaPost {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  course_id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: false })
  isResolved: boolean;
}

export const QnaPostSchema = SchemaFactory.createForClass(QnaPost);

QnaPostSchema.index({ course_id: 1, isResolved: 1, createdAt: -1 });
QnaPostSchema.index({ user_id: 1, createdAt: -1 });
