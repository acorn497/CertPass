import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../common/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { SchedulerService } from './scheduler.service';

@Controller('scheduler')
@Roles('admin')
@UseGuards(JwtGuard, RolesGuard)
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post('digest/run')
  async runDigest() {
    const data = await this.schedulerService.sendDailyDigest();
    return { success: true, data };
  }

  @Post('cleanup/run')
  runCleanup() {
    const data = this.schedulerService.cleanup();
    return { success: true, data };
  }

  @Post('exam-dday/run')
  async runExamDday() {
    const data = await this.schedulerService.sendExamDdayDigest();
    return { success: true, data };
  }
}
