import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { Progress, ProgressSchema } from '../schemas/progress.schema';
import { Enrollment, EnrollmentSchema } from '../schemas/enrollment.schema';
import { Episode, EpisodeSchema } from '../schemas/episode.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Progress.name, schema: ProgressSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Episode.name, schema: EpisodeSchema },
    ]),
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
})
export class ProgressModule {}
