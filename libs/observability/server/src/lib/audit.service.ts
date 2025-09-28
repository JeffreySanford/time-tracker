import { Injectable, Logger } from '@nestjs/common';
import { AnyAuditEvent } from '@time-tracker/observability-shared';
import { globalMetricsStore, MetricsSnapshot } from './metrics.store';

@Injectable()
export class AuditService {
  private readonly logger = new Logger('Audit');
  emit<E extends AnyAuditEvent>(event: E) {
    // For now just structured log; can swap to DB persistence later
    this.logger.log(JSON.stringify(event));
    try {
      globalMetricsStore.record(event);
    } catch (err) {
      this.logger.warn(`Metrics record failed: ${String(err)}`);
    }
  }

  emitBatch(events: AnyAuditEvent[]) {
    for (const e of events) this.emit(e);
  }

  metrics(): MetricsSnapshot {
    return globalMetricsStore.snapshot();
  }
}
