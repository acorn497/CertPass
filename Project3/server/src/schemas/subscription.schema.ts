import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  user_id: Types.ObjectId | null;

  @Prop({ required: true, enum: ['email', 'discord'] })
  type: 'email' | 'discord';

  @Prop({ type: String, default: null, lowercase: true })
  email: string | null;

  @Prop({ type: String, default: null })
  discordWebhookUrl: string | null;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: ['course_updates', 'qna_digest'] })
  topics: string[];

  @Prop({ type: Date, default: null })
  lastNotifiedAt: Date | null;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

SubscriptionSchema.index({ type: 1, email: 1 }, { sparse: true });
SubscriptionSchema.index({ type: 1, discordWebhookUrl: 1 }, { sparse: true });
SubscriptionSchema.index({ isActive: 1, lastNotifiedAt: 1 });
