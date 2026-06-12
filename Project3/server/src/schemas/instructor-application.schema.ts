import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export const APPLICATION_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type InstructorApplicationDocument = InstructorApplication & Document;

@Schema({ timestamps: true })
export class InstructorApplication {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ required: true })
  motivation: string;

  @Prop({ type: String, default: 'pending', enum: APPLICATION_STATUSES })
  status: ApplicationStatus;

  @Prop({ type: String, default: null })
  reviewNote: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  reviewedBy: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  reviewedAt: Date | null;
}

export const InstructorApplicationSchema =
  SchemaFactory.createForClass(InstructorApplication);

// 처리 대기(pending) 신청은 사용자당 하나만 존재하도록 보장
InstructorApplicationSchema.index(
  { user_id: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } },
);
