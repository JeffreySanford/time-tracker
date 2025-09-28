import { describe, expect, it } from 'vitest';
import { MetricsStore } from './metrics.store';

describe('MetricsStore', () => {
  it('accumulates counts and file session durations', () => {
    const ms = new MetricsStore();
    ms.record({
      type: 'file.opened',
      at: new Date().toISOString(),
      data: { fileId: 'f1', openedAt: new Date().toISOString() },
    } as any);
    ms.record({
      type: 'file.closed',
      at: new Date().toISOString(),
      data: {
        fileId: 'f1',
        openedAt: new Date(Date.now() - 50).toISOString(),
        closedAt: new Date().toISOString(),
        durationMs: 50,
      },
    } as any);
    const snap = ms.snapshot();
    expect(snap.counts['file.opened']).toBe(1);
    expect(snap.counts['file.closed']).toBe(1);
    expect(snap.fileSessions.closed).toBe(1);
    expect(snap.fileSessions.avgDurationMs).toBeGreaterThanOrEqual(0);
  });
});
