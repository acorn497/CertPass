import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subscription, SubscriptionDocument } from '../schemas/subscription.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { appLogger } from '../common/app-logger';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name)
    private readonly subscriptionModel: Model<SubscriptionDocument>,
    private readonly notifications: NotificationsService,
  ) {}

  async subscribeEmail(userId: string | null, email: string, topics: string[] = []) {
    const subscription = await this.subscriptionModel.findOneAndUpdate(
      { type: 'email', email: email.toLowerCase() },
      {
        type: 'email',
        email: email.toLowerCase(),
        user_id: userId ? new Types.ObjectId(userId) : null,
        discordWebhookUrl: null,
        isActive: true,
        topics: topics.length ? topics : ['course_updates', 'qna_digest', 'exam_d_day'],
      },
      { new: true, upsert: true },
    );
    await this.notifications.sendEmail(
      subscription.email!,
      '[P3 Learning] 구독이 등록되었습니다',
      '강의 업데이트와 Q&A 요약 알림을 보내드리겠습니다.',
    );
    return subscription;
  }

  async subscribeDiscord(userId: string | null, webhookUrl: string, topics: string[] = []) {
    if (!webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      throw new BadRequestException('Discord webhook URL 형식이 올바르지 않습니다');
    }
    const subscription = await this.subscriptionModel.findOneAndUpdate(
      { type: 'discord', discordWebhookUrl: webhookUrl },
      {
        type: 'discord',
        email: null,
        user_id: userId ? new Types.ObjectId(userId) : null,
        discordWebhookUrl: webhookUrl,
        isActive: true,
        topics: topics.length ? topics : ['course_updates', 'qna_digest', 'exam_d_day'],
      },
      { new: true, upsert: true },
    );
    await this.notifications.sendDiscord(webhookUrl, 'P3 Learning 알림 구독이 등록되었습니다.');
    return subscription;
  }

  async findMine(userId: string) {
    return this.subscriptionModel
      .find({ user_id: new Types.ObjectId(userId), isActive: true })
      .sort({ createdAt: -1 })
      .lean();
  }

  async unsubscribe(subscriptionId: string, userId: string) {
    const subscription = await this.subscriptionModel.findById(subscriptionId);
    if (!subscription || String(subscription.user_id) !== userId) {
      throw new NotFoundException('구독을 찾을 수 없습니다');
    }
    subscription.isActive = false;
    await subscription.save();
    return { message: '구독이 해지되었습니다.' };
  }

  async notifyActiveSubscribers(subject: string, message: string, topic = 'course_updates') {
    const subscriptions = await this.subscriptionModel
      .find({ isActive: true, topics: topic })
      .limit(100)
      .exec();

    let sent = 0;
    for (const subscription of subscriptions) {
      try {
        if (subscription.type === 'email' && subscription.email) {
          await this.notifications.sendEmail(subscription.email, subject, message);
        }
        if (subscription.type === 'discord' && subscription.discordWebhookUrl) {
          await this.notifications.sendDiscord(subscription.discordWebhookUrl, message);
        }
        subscription.lastNotifiedAt = new Date();
        await subscription.save();
        sent += 1;
      } catch (error) {
        appLogger.warn('subscription_notification_failed', {
          subscriptionId: String(subscription._id),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return { sent };
  }
}
