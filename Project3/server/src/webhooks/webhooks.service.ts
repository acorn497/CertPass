import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebhookEvent, WebhookEventDocument } from '../schemas/webhook-event.schema';
import { appLogger } from '../common/app-logger';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectModel(WebhookEvent.name)
    private readonly webhookEventModel: Model<WebhookEventDocument>,
  ) {}

  async receive(provider: string, payload: Record<string, unknown>, headers: Record<string, unknown>) {
    const expectedSecret = process.env.INBOUND_WEBHOOK_SECRET;
    if (expectedSecret && headers['x-webhook-secret'] !== expectedSecret) {
      throw new ForbiddenException('웹훅 시크릿이 올바르지 않습니다');
    }

    const event = await this.webhookEventModel.create({
      provider,
      direction: 'inbound',
      status: 'received',
      eventType: String(payload.type ?? payload.event ?? 'unknown'),
      payload,
      headers,
    });
    appLogger.info('webhook_received', { provider, eventId: String(event._id) });
    return event;
  }

  async markProcessed(eventId: string) {
    return this.webhookEventModel.findByIdAndUpdate(
      eventId,
      { status: 'processed' },
      { new: true },
    );
  }

  async send(url: string, eventType: string, payload: Record<string, unknown>) {
    const event = await this.webhookEventModel.create({
      provider: new URL(url).hostname,
      direction: 'outbound',
      status: 'received',
      eventType,
      payload,
      headers: {},
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-P3-Event': eventType,
          ...(process.env.OUTBOUND_WEBHOOK_SECRET
            ? { 'X-Webhook-Secret': process.env.OUTBOUND_WEBHOOK_SECRET }
            : {}),
        },
        body: JSON.stringify(payload),
      });
      event.status = response.ok ? 'processed' : 'failed';
      event.errorMessage = response.ok ? null : `HTTP ${response.status}`;
      await event.save();
      return event;
    } catch (error) {
      event.status = 'failed';
      event.errorMessage = error instanceof Error ? error.message : String(error);
      await event.save();
      return event;
    }
  }
}
