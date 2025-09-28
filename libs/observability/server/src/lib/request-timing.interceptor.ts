import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

// Minimal in-memory metrics (can be swapped for prom-client)
const metrics = {
  total: 0,
  errors: 0,
  durations: [] as number[],
  observe(ms: number, error: boolean) {
    this.total += 1;
    if (error) this.errors += 1;
    if (this.durations.length < 1000) this.durations.push(ms); // simple cap
  },
};

export function getInMemoryMetrics() {
  return {
    ...metrics,
    p50: percentile(metrics.durations, 50),
    p90: percentile(metrics.durations, 90),
  };
}

function percentile(arr: number[], p: number) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.floor((p / 100) * (sorted.length - 1));
  return sorted[idx];
}

@Injectable()
export class RequestTimingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = performance.now();
    return next.handle().pipe(
      tap({
        next: () => metrics.observe(performance.now() - start, false),
        error: () => metrics.observe(performance.now() - start, true),
      }),
    );
  }
}
