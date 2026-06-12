import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  course_id: Types.ObjectId;

  @Prop({ required: true })
  provider: 'toss' | 'sandbox';

  @Prop({ required: true, enum: ['pending', 'paid', 'failed', 'cancelled'] })
  status: 'pending' | 'paid' | 'failed' | 'cancelled';

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, default: 'KRW' })
  currency: string;

  @Prop({ type: String, default: null })
  providerSessionId: string | null;

  @Prop({ type: String, default: null })
  orderId: string | null;

  @Prop({ type: String, default: null })
  paymentKey: string | null;

  @Prop({ type: String, default: null })
  checkoutUrl: string | null;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ user_id: 1, createdAt: -1 });
PaymentSchema.index({ providerSessionId: 1 }, { sparse: true });
PaymentSchema.index({ orderId: 1 }, { sparse: true });
PaymentSchema.index({ paymentKey: 1 }, { sparse: true });
