import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { CacheService } from '../common/cache.service';
import { MetricsService } from '../common/metrics.service';
import { JwtGuard } from '../common/jwt.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';

@Controller()
export class MonitoringController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly metrics: MetricsService,
    private readonly cache: CacheService,
  ) {}

  @Get('health')
  health() {
    return {
      success: true,
      data: {
        status: this.connection.readyState === 1 ? 'ok' : 'degraded',
        database: this.connection.readyState,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('metrics')
  @Roles('admin')
  @UseGuards(JwtGuard, RolesGuard)
  metricsSnapshot() {
    return {
      success: true,
      data: {
        ...this.metrics.snapshot(),
        cache: this.cache.snapshot(),
      },
    };
  }
}
