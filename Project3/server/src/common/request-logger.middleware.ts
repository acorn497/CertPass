import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { appLogger } from './app-logger';
import { MetricsService } from './metrics.service';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly metrics: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startedAt = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      this.metrics.increment('http_requests_total');
      this.metrics.increment(`http_status_${res.statusCode}`);
      this.metrics.observe('http_request_duration_ms', durationMs);
      appLogger.info('http_request', {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
      });
    });
    next();
  }
}
