import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { App } from 'supertest/types';
import { MonitoringController } from '../src/monitoring/monitoring.controller';
import { CacheService } from '../src/common/cache.service';
import { MetricsService } from '../src/common/metrics.service';
import { User } from '../src/schemas/user.schema';

describe('MonitoringController (e2e)', () => {
  let app: INestApplication<App>;
  let controller: MonitoringController;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MonitoringController],
      providers: [
        CacheService,
        MetricsService,
        { provide: 'DatabaseConnection', useValue: { readyState: 1 } },
        { provide: getModelToken(User.name), useValue: { findById: jest.fn() } },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
    controller = moduleFixture.get(MonitoringController);
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('/api/v1/health (GET)', () => {
    const body = controller.health();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
  });
});
