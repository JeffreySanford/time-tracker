import type {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { AnyAuditEvent } from '@time-tracker/observability-shared';
import { tap } from 'rxjs/operators';

export interface ObsHttpConfig {
  emit: (e: AnyAuditEvent) => void;
  actor?: string;
}

export function createObsHttpInterceptor(
  cfg: ObsHttpConfig,
): HttpInterceptorFn {
  return (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    const started = Date.now();
    const rid = crypto.randomUUID();
    cfg.emit({
      type: 'timer.started',
      at: new Date(started).toISOString(),
      rid,
      actor: cfg.actor,
      data: { url: req.url, method: req.method },
    });
    return next(req).pipe(
      tap({
        error: (err) => {
          const stopped = Date.now();
          cfg.emit({
            type: 'timer.stopped',
            at: new Date(stopped).toISOString(),
            rid,
            actor: cfg.actor,
            data: {
              durationMs: stopped - started,
              error: String(err),
              url: req.url,
              method: req.method,
            },
          });
        },
        complete: () => {
          const stopped = Date.now();
          cfg.emit({
            type: 'timer.stopped',
            at: new Date(stopped).toISOString(),
            rid,
            actor: cfg.actor,
            data: {
              durationMs: stopped - started,
              url: req.url,
              method: req.method,
            },
          });
        },
      }),
    );
  };
}
