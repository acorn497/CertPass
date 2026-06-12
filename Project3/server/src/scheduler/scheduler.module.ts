import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RolesGuard } from '../common/roles.guard';
import { Exam, ExamSchema } from '../schemas/exam.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [
    SubscriptionsModule,
    MongooseModule.forFeature([
      { name: Exam.name, schema: ExamSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [SchedulerController],
  providers: [SchedulerService, RolesGuard],
})
export class SchedulerModule {}
