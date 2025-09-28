import { AnyAuditEvent } from '@time-tracker/observability-shared';

export interface FileSessionOptions {
  project?: string;
  storageClass?: string;
  origin?: string;
  mode?: 'read' | 'write' | 'rw';
}

interface ActiveSession {
  fileId: string;
  path?: string;
  openedAt: number;
  opts: FileSessionOptions;
  bytesRead: number;
  bytesWritten: number;
  changes: number;
}

export class FileSessionTracker {
  private active = new Map<string, ActiveSession>();
  private out: (e: AnyAuditEvent) => void;

  constructor(emitter: (e: AnyAuditEvent) => void) {
    this.out = emitter;
  }

  open(fileId: string, path?: string, opts: FileSessionOptions = {}) {
    if (this.active.has(fileId)) return; // ignore duplicate
    const openedAt = Date.now();
    this.active.set(fileId, {
      fileId,
      path,
      openedAt,
      opts,
      bytesRead: 0,
      bytesWritten: 0,
      changes: 0,
    });
    this.out({
      type: 'file.opened',
      at: new Date(openedAt).toISOString(),
      data: {
        fileId,
        path,
        project: opts.project,
        storageClass: opts.storageClass,
        openedAt: new Date(openedAt).toISOString(),
        mode: opts.mode,
        origin: opts.origin,
      },
    });
  }

  recordRead(fileId: string, bytes: number) {
    const s = this.active.get(fileId);
    if (s) s.bytesRead += bytes;
  }
  recordWrite(fileId: string, bytes: number, changeUnits = 1) {
    const s = this.active.get(fileId);
    if (s) {
      s.bytesWritten += bytes;
      s.changes += changeUnits;
    }
  }

  close(fileId: string) {
    const s = this.active.get(fileId);
    if (!s) return;
    this.active.delete(fileId);
    const closedAt = Date.now();
    const durationMs = closedAt - s.openedAt;
    this.out({
      type: 'file.closed',
      at: new Date(closedAt).toISOString(),
      data: {
        fileId: s.fileId,
        path: s.path,
        project: s.opts.project,
        storageClass: s.opts.storageClass,
        openedAt: new Date(s.openedAt).toISOString(),
        closedAt: new Date(closedAt).toISOString(),
        durationMs,
        changes: s.changes,
        bytesRead: s.bytesRead,
        bytesWritten: s.bytesWritten,
      },
    });
  }

  persist(
    fileId: string,
    checksum?: string,
    sizeBytes?: number,
    version?: string,
  ) {
    this.out({
      type: 'file.persisted',
      at: new Date().toISOString(),
      data: { fileId, checksum, sizeBytes, version },
    });
  }
}
