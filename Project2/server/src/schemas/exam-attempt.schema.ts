import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExamAttemptDocument = ExamAttempt & Document;

@Schema()
export class ExamAttempt {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Exam', required: true })
  exam_id: Types.ObjectId;

  @Prop({ type: [{ questionId: Types.ObjectId, selected: Number }], default: [] })
  answers: Array<{ questionId: Types.ObjectId; selected: number }>;

  @Prop({ required: true })
  score: number;

  @Prop({ required: true })
  correctCount: number;

  @Prop({ required: true })
  totalCount: number;

  @Prop({ default: Date.now })
  completedAt: Date;
}

export const ExamAttemptSchema = SchemaFactory.createForClass(ExamAttempt);
