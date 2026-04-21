import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QnaController } from './qna.controller';
import { QnaService } from './qna.service';
import { QnaPost, QnaPostSchema } from '../schemas/qna-post.schema';
import { QnaComment, QnaCommentSchema } from '../schemas/qna-comment.schema';
import { Enrollment, EnrollmentSchema } from '../schemas/enrollment.schema';
import { Course, CourseSchema } from '../schemas/course.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { RolesGuard } from '../common/roles.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QnaPost.name, schema: QnaPostSchema },
      { name: QnaComment.name, schema: QnaCommentSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Course.name, schema: CourseSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [QnaController],
  providers: [QnaService, RolesGuard],
})
export class QnaModule {}
