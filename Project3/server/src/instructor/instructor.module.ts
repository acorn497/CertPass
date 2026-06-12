import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InstructorController } from './instructor.controller';
import { InstructorService } from './instructor.service';
import { Course, CourseSchema } from '../schemas/course.schema';
import { Enrollment, EnrollmentSchema } from '../schemas/enrollment.schema';
import { Progress, ProgressSchema } from '../schemas/progress.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { QnaPost, QnaPostSchema } from '../schemas/qna-post.schema';
import { QnaComment, QnaCommentSchema } from '../schemas/qna-comment.schema';
import { RolesGuard } from '../common/roles.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Progress.name, schema: ProgressSchema },
      { name: User.name, schema: UserSchema },
      { name: QnaPost.name, schema: QnaPostSchema },
      { name: QnaComment.name, schema: QnaCommentSchema },
    ]),
  ],
  controllers: [InstructorController],
  providers: [InstructorService, RolesGuard],
})
export class InstructorModule {}
