import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/user.schema';
import { RolesGuard } from '../common/roles.guard';
import { MonitoringController } from './monitoring.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [MonitoringController],
  providers: [RolesGuard],
})
export class MonitoringModule {}
