import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InstructorController } from './instructor.controller';
import { InstructorService } from './instructor.service';
import { Course, CourseSchema } from '../schemas/course.schema';
import { Enrollment, EnrollmentSchema } from '../schemas/enrollment.schema';
import { Progress, ProgressSchema } from '../schemas/progress.schema';
import { Episode, EpisodeSchema } from '../schemas/episode.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { RolesGuard } from '../common/roles.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Progress.name, schema: ProgressSchema },
      { name: Episode.name, schema: EpisodeSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [InstructorController],
  providers: [InstructorService, RolesGuard],
})
export class InstructorModule {}
