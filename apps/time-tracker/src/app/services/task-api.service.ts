import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface TaskDto {
  id?: string;
  title?: string;
  description?: string;
  project?: string;
  tags?: string[];
  status?: string;
  timeSpent?: number;
  createdAt?: string | Date;
}

@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private subject = new BehaviorSubject<TaskDto[] | null>(null);
  readonly tasks$ = this.subject.asObservable();

  constructor(private readonly http: HttpClient) {}

  // Refresh from the API and update the hot stream. Optionally filter by project on the server.
  refresh(projectId?: string): Observable<TaskDto[] | null> {
    const url = projectId ? `/api/tasks/project/${encodeURIComponent(projectId)}` : '/api/tasks';
    return this.http.get<TaskDto[]>(url).pipe(
      tap(data => this.subject.next(data)),
      catchError(err => {
        this.subject.next(null);
        return of(null);
      })
    );
  }

  // Backwards-compatible: return the hot observable stream; if projectId supplied, return a mapped stream filtered client-side
  fetchTasks(projectId?: string): Observable<TaskDto[] | null> {
    if (!projectId) return this.tasks$;
    return this.tasks$.pipe(map(list => (list ? list.filter(t => t.project === projectId) : null)));
  }

  // Persist and update the cache on success. Does not perform optimistic mutation; consumers can optimistically update the cache before calling if desired.
  persistTask(task: TaskDto): Observable<TaskDto | void> {
    if (!task || !task.id) {
      return this.http.post<TaskDto>('/api/tasks', task).pipe(
        tap(created => {
          const current = this.subject.getValue() || [];
          this.subject.next([...current, created]);
        })
      );
    }

    return this.http.patch<TaskDto>(`/api/tasks/${encodeURIComponent(task.id)}`, task).pipe(
      tap(updated => {
        const current = this.subject.getValue() || [];
        const next = current.map(t => (t.id === updated.id ? updated : t));
        this.subject.next(next);
      })
    );
  }

  deleteTask(taskId: string): Observable<void> {
    return this.http.delete<void>(`/api/tasks/${encodeURIComponent(taskId)}`).pipe(
      tap(() => {
        const current = this.subject.getValue() || [];
        this.subject.next(current.filter(t => t.id !== taskId));
      })
    );
  }

  // Synchronous snapshot for convenience
  getSnapshot(): TaskDto[] | null { return this.subject.getValue(); }
}
