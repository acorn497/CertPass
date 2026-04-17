import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QnaCommentDocument = QnaComment & Document;

@Schema({ timestamps: true })
export class QnaComment {
  @Prop({ type: Types.ObjectId, ref: 'QnaPost', required: true })
  post_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ default: false })
  isInstructor: boolean;
}

export const QnaCommentSchema = SchemaFactory.createForClass(QnaComment);
