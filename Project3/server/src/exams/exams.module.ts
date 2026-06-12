import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';
import { Exam, ExamSchema } from '../schemas/exam.schema';
import { Question, QuestionSchema } from '../schemas/question.schema';
import { ExamAttempt, ExamAttemptSchema } from '../schemas/exam-attempt.schema';
import { Course, CourseSchema } from '../schemas/course.schema';
import { Enrollment, EnrollmentSchema } from '../schemas/enrollment.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { RolesGuard } from '../common/roles.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Exam.name, schema: ExamSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: ExamAttempt.name, schema: ExamAttemptSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ExamsController],
  providers: [ExamsService, RolesGuard],
})
export class ExamsModule {}
