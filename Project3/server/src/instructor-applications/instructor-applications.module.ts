import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  InstructorApplication,
  InstructorApplicationSchema,
} from '../schemas/instructor-application.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { RolesGuard } from '../common/roles.guard';
import { InstructorApplicationsController } from './instructor-applications.controller';
import { InstructorApplicationsService } from './instructor-applications.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InstructorApplication.name, schema: InstructorApplicationSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [InstructorApplicationsController],
  providers: [InstructorApplicationsService, RolesGuard],
})
export class InstructorApplicationsModule {}
