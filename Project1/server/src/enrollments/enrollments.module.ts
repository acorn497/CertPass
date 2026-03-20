import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { Enrollment, EnrollmentSchema } from '../schemas/enrollment.schema';
import { Course, CourseSchema } from '../schemas/course.schema';
import { Episode, EpisodeSchema } from '../schemas/episode.schema';
import { Progress, ProgressSchema } from '../schemas/progress.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Episode.name, schema: EpisodeSchema },
      { name: Progress.name, schema: ProgressSchema },
    ]),
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
})
export class EnrollmentsModule {}
