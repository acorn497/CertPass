import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ProgressModule } from './progress/progress.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ExamsModule } from './exams/exams.module';
import { QnaModule } from './qna/qna.module';
import { InstructorModule } from './instructor/instructor.module';
import { InstructorApplicationsModule } from './instructor-applications/instructor-applications.module';
import { AdminModule } from './admin/admin.module';
import { CacheModule } from './common/cache.service';
import { MetricsModule } from './common/metrics.service';
import { RequestLoggerMiddleware } from './common/request-logger.middleware';
import { NoSqlInjectionMiddleware, XssSanitizerMiddleware } from './common/security.middleware';
import { NotificationsModule } from './notifications/notifications.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI!),
    CacheModule,
    MetricsModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    CoursesModule,
    EnrollmentsModule,
    ProgressModule,
    ReviewsModule,
    ExamsModule,
    QnaModule,
    InstructorModule,
    InstructorApplicationsModule,
    AdminModule,
    SubscriptionsModule,
    WebhooksModule,
    MonitoringModule,
    SchedulerModule,
    PaymentsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggerMiddleware, NoSqlInjectionMiddleware, XssSanitizerMiddleware)
      .forRoutes('*');
  }
}
