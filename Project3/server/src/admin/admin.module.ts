import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from '../schemas/user.schema';
import { Course, CourseSchema } from '../schemas/course.schema';
import { Enrollment, EnrollmentSchema } from '../schemas/enrollment.schema';
import { Review, ReviewSchema } from '../schemas/review.schema';
import { QnaPost, QnaPostSchema } from '../schemas/qna-post.schema';
import { QnaComment, QnaCommentSchema } from '../schemas/qna-comment.schema';
import { Progress, ProgressSchema } from '../schemas/progress.schema';
import { RolesGuard } from '../common/roles.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: QnaPost.name, schema: QnaPostSchema },
      { name: QnaComment.name, schema: QnaCommentSchema },
      { name: Progress.name, schema: ProgressSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, RolesGuard],
})
export class AdminModule {}
