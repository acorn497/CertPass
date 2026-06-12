import { Global, Injectable, Module } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private readonly counters = new Map<string, number>();
  private readonly timings = new Map<string, { count: number; totalMs: number; maxMs: number }>();
  private readonly startedAt = Date.now();

  increment(name: string, value = 1) {
    this.counters.set(name, (this.counters.get(name) ?? 0) + value);
  }

  observe(name: string, ms: number) {
    const current = this.timings.get(name) ?? { count: 0, totalMs: 0, maxMs: 0 };
    current.count += 1;
    current.totalMs += ms;
    current.maxMs = Math.max(current.maxMs, ms);
    this.timings.set(name, current);
  }

  snapshot() {
    return {
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000),
      counters: Object.fromEntries(this.counters.entries()),
      timings: Object.fromEntries(
        [...this.timings.entries()].map(([key, value]) => [
          key,
          {
            count: value.count,
            avgMs: value.count ? Math.round(value.totalMs / value.count) : 0,
            maxMs: Math.round(value.maxMs),
          },
        ]),
      ),
      memory: process.memoryUsage(),
    };
  }
}

@Global()
@Module({
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
