export type AuditEventType =
  | 'task.created'
  | 'task.updated'
  | 'task.deleted'
  | 'project.flags.updated'
  | 'timer.started'
  | 'timer.stopped'
  | 'seed.run'
  | 'seed.skipped'
  // File session lifecycle
  | 'file.opened'
  | 'file.closed'
  | 'file.persisted'
  // Security & integrity
  | 'security.upload.started'
  | 'security.upload.completed'
  | 'security.scan.performed'
  | 'security.hash.mismatch'
  | 'security.access.denied';

export interface AuditEvent<
  TType extends AuditEventType = AuditEventType,
  TData = unknown,
> {
  type: TType;
  at: string; // ISO timestamp
  rid?: string; // correlation/request id
  actor?: string; // user id or system
  data: TData;
}

export interface TaskCreatedData {
  taskId: string;
  project: string;
  title: string;
}
export type TaskCreatedEvent = AuditEvent<'task.created', TaskCreatedData>;

export type AnyAuditEvent =
  | TaskCreatedEvent
  | AuditEvent<
      'task.updated',
      { taskId: string; project: string; changed: string[] }
    >
  | AuditEvent<'task.deleted', { taskId: string; project: string }>
  | AuditEvent<
      'project.flags.updated',
      { project: string; flags: Record<string, unknown> }
    >
  | AuditEvent<
      'timer.started',
      { sessionId?: string; url?: string; method?: string }
    >
  | AuditEvent<
      'timer.stopped',
      {
        sessionId?: string;
        durationMs?: number;
        url?: string;
        method?: string;
        error?: string;
      }
    >
  | AuditEvent<
      'seed.run',
      { collection: string; inserted: number; hash: string }
    >
  | AuditEvent<'seed.skipped', { collection: string; reason: string }>
  // File lifecycle
  | AuditEvent<
      'file.opened',
      {
        fileId: string;
        path?: string;
        project?: string;
        storageClass?: string;
        openedAt: string;
        mode?: 'read' | 'write' | 'rw';
        origin?: string;
      }
    >
  | AuditEvent<
      'file.closed',
      {
        fileId: string;
        path?: string;
        project?: string;
        storageClass?: string;
        openedAt: string;
        closedAt: string;
        durationMs: number;
        changes?: number;
        bytesRead?: number;
        bytesWritten?: number;
      }
    >
  | AuditEvent<
      'file.persisted',
      {
        fileId: string;
        path?: string;
        project?: string;
        storageClass?: string;
        checksum?: string;
        sizeBytes?: number;
        version?: string;
      }
    >
  // Security / integrity
  | AuditEvent<
      'security.upload.started',
      {
        uploadId: string;
        fileId?: string;
        filename: string;
        sizeBytes?: number;
        contentType?: string;
      }
    >
  | AuditEvent<
      'security.upload.completed',
      {
        uploadId: string;
        fileId?: string;
        filename: string;
        sizeBytes?: number;
        durationMs?: number;
        checksum?: string;
      }
    >
  | AuditEvent<
      'security.scan.performed',
      {
        fileId?: string;
        scanId: string;
        findings: number;
        severityCounts?: Record<string, number>;
        durationMs?: number;
      }
    >
  | AuditEvent<
      'security.hash.mismatch',
      {
        fileId: string;
        expected: string;
        actual: string;
        action: 'rejected' | 'quarantined' | 'logged';
      }
    >
  | AuditEvent<
      'security.access.denied',
      { fileId?: string; actor?: string; reason: string; operation: string }
    >;
