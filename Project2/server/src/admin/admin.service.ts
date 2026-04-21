import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Course, CourseDocument } from '../schemas/course.schema';
import { Enrollment, EnrollmentDocument } from '../schemas/enrollment.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Course.name) private courseModel: Model<CourseDocument>,
    @InjectModel(Enrollment.name)
    private enrollmentModel: Model<EnrollmentDocument>,
  ) {}

  async stats() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const [totalUsers, totalCourses, pendingCourses, todayEnrollments] =
      await Promise.all([
        this.userModel.countDocuments(),
        this.courseModel.countDocuments(),
        this.courseModel.countDocuments({ status: 'pending' }),
        this.enrollmentModel.countDocuments({ enrolledAt: { $gte: start } }),
      ]);
    return { totalUsers, totalCourses, pendingCourses, todayEnrollments };
  }
}
