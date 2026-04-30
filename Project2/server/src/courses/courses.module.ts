import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoursesController } from './courses.controller';
import { EpisodesController } from './episodes.controller';
import { CoursesService } from './courses.service';
import { Course, CourseSchema } from '../schemas/course.schema';
import { Category, CategorySchema } from '../schemas/category.schema';
import { Enrollment, EnrollmentSchema } from '../schemas/enrollment.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { RolesGuard } from '../common/roles.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Course.name, schema: CourseSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [CoursesController, EpisodesController],
  providers: [CoursesService, RolesGuard],
  exports: [CoursesService],
})
export class CoursesModule {}
