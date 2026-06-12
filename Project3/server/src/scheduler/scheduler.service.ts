import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { CacheService } from '../common/cache.service';
import { MetricsService } from '../common/metrics.service';
import { appLogger } from '../common/app-logger';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { InjectModel } from '@nestjs/mongoose';
import { Exam, ExamDocument } from '../schemas/exam.schema';
import { Model } from 'mongoose';

type CronTask = { stop(): void };

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly tasks: CronTask[] = [];

  constructor(
    private readonly cache: CacheService,
    private readonly metrics: MetricsService,
    private readonly subscriptions: SubscriptionsService,
    @InjectModel(Exam.name) private readonly examModel: Model<ExamDocument>,
  ) {}

  onModuleInit() {
    if (process.env.SCHEDULER_ENABLED === 'false') {
      appLogger.info('scheduler_disabled');
      return;
    }

    try {
      const cron = require('node-cron');
      this.tasks.push(
        cron.schedule(process.env.DIGEST_CRON ?? '0 9 * * *', () => this.sendDailyDigest()),
        cron.schedule(process.env.EXAM_DDAY_CRON ?? '0 8 * * *', () => this.sendExamDdayDigest()),
        cron.schedule(process.env.CLEANUP_CRON ?? '*/15 * * * *', () => this.cleanup()),
      );
      appLogger.info('scheduler_started', { tasks: this.tasks.length });
    } catch {
      appLogger.warn('scheduler_dependency_missing', { dependency: 'node-cron' });
    }
  }

  onModuleDestroy() {
    this.tasks.forEach((task) => task.stop());
  }

  async sendDailyDigest() {
    this.metrics.increment('scheduler_digest_runs_total');
    const result = await this.subscriptions.notifyActiveSubscribers(
      '[P3 Learning] 오늘의 학습 알림',
      '새 강의 업데이트와 미답변 Q&A를 확인해 주세요.',
      'qna_digest',
    );
    appLogger.info('scheduler_digest_completed', result);
    return result;
  }

  async sendExamDdayDigest() {
    this.metrics.increment('scheduler_exam_dday_runs_total');
    const now = new Date();
    const until = new Date(now);
    until.setDate(until.getDate() + 7);
    const exams = await this.examModel
      .find({ examDate: { $gte: now, $lte: until } })
      .populate('course_id', 'title')
      .sort({ examDate: 1 })
      .limit(20)
      .lean();

    if (!exams.length) return { sent: 0, exams: 0 };

    const lines = exams.map((exam) => {
      const dday = Math.ceil((new Date(exam.examDate!).getTime() - now.getTime()) / 86_400_000);
      const course = exam.course_id as unknown as { title?: string };
      return `${course?.title ?? '강의'} - ${exam.title}: D-${dday}`;
    });
    const result = await this.subscriptions.notifyActiveSubscribers(
      '[P3 Learning] 시험 D-day 알림',
      lines.join('\n'),
      'exam_d_day',
    );
    appLogger.info('scheduler_exam_dday_completed', { ...result, exams: exams.length });
    return { ...result, exams: exams.length };
  }

  cleanup() {
    this.metrics.increment('scheduler_cleanup_runs_total');
    const removed = this.cache.clearExpired();
    appLogger.info('scheduler_cleanup_completed', { removedCacheKeys: removed });
    return { removedCacheKeys: removed };
  }
}
