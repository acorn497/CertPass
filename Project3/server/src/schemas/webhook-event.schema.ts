import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WebhookEventDocument = WebhookEvent & Document;

@Schema({ timestamps: true })
export class WebhookEvent {
  @Prop({ required: true })
  provider: string;

  @Prop({ required: true, enum: ['inbound', 'outbound'] })
  direction: 'inbound' | 'outbound';

  @Prop({ required: true, enum: ['received', 'processed', 'failed'] })
  status: 'received' | 'processed' | 'failed';

  @Prop({ type: String, default: null })
  eventType: string | null;

  @Prop({ type: Object, default: {} })
  payload: Record<string, unknown>;

  @Prop({ type: Object, default: {} })
  headers: Record<string, unknown>;

  @Prop({ type: String, default: null })
  errorMessage: string | null;
}

export const WebhookEventSchema = SchemaFactory.createForClass(WebhookEvent);

WebhookEventSchema.index({ provider: 1, direction: 1, createdAt: -1 });
WebhookEventSchema.index({ status: 1, createdAt: -1 });
