import { AnyAuditEvent } from '@time-tracker/observability-shared';

export interface MetricsSnapshot {
  counts: Record<string, number>;
  fileSessions: {
    open: number;
    closed: number;
    avgDurationMs: number | null;
    p90DurationMs: number | null;
    p99DurationMs: number | null;
  };
  security: {
    uploadsStarted: number;
    uploadsCompleted: number;
    hashMismatches: number;
    accessDenied: number;
    scans: number;
  };
  updatedAt: string;
}

interface FileSessionAccum {
  durations: number[]; // ms
  open: number;
  closed: number;
}

export class MetricsStore {
  private counts: Record<string, number> = {};
  private file: FileSessionAccum = { durations: [], open: 0, closed: 0 };
  private security = {
    uploadsStarted: 0,
    uploadsCompleted: 0,
    hashMismatches: 0,
    accessDenied: 0,
    scans: 0,
  };

  record(event: AnyAuditEvent) {
    this.counts[event.type] = (this.counts[event.type] || 0) + 1;
    switch (event.type) {
      case 'file.opened':
        this.file.open++;
        break;
      case 'file.closed':
        this.file.closed++;
        if (typeof event.data.durationMs === 'number') {
          this.file.durations.push(event.data.durationMs);
        }
        break;
      case 'security.upload.started':
        this.security.uploadsStarted++;
        break;
      case 'security.upload.completed':
        this.security.uploadsCompleted++;
        break;
      case 'security.hash.mismatch':
        this.security.hashMismatches++;
        break;
      case 'security.access.denied':
        this.security.accessDenied++;
        break;
      case 'security.scan.performed':
        this.security.scans++;
        break;
      default:
        break;
    }
  }

  snapshot(): MetricsSnapshot {
    const durations = [...this.file.durations].sort((a, b) => a - b);
    const avg =
      durations.length === 0
        ? null
        : durations.reduce((s, d) => s + d, 0) / durations.length;
    const p = (pct: number) => {
      if (!durations.length) return null;
      const idx = Math.min(
        durations.length - 1,
        Math.floor((pct / 100) * durations.length),
      );
      return durations[idx];
    };
    return {
      counts: { ...this.counts },
      fileSessions: {
        open: this.file.open,
        closed: this.file.closed,
        avgDurationMs: avg === null ? null : Math.round(avg),
        p90DurationMs: p(90),
        p99DurationMs: p(99),
      },
      security: { ...this.security },
      updatedAt: new Date().toISOString(),
    };
  }

  reset() {
    this.counts = {};
    this.file = { durations: [], open: 0, closed: 0 };
    this.security = {
      uploadsStarted: 0,
      uploadsCompleted: 0,
      hashMismatches: 0,
      accessDenied: 0,
      scans: 0,
    };
  }
}

export const globalMetricsStore = new MetricsStore();
