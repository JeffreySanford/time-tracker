import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface TimeWorkedSessionDto {
  _id: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class TimeWorkedApiService {
  private subject = new BehaviorSubject<TimeWorkedSessionDto | null>(null);
  readonly session$ = this.subject.asObservable();

  private readonly http = inject(HttpClient);

  start(userId = 'demo-user'): Observable<TimeWorkedSessionDto | void> {
    return this.http.post<TimeWorkedSessionDto>('/api/timeworked/start', { userId }).pipe(
      tap(session => this.subject.next(session)),
      catchError(() => of(undefined))
    );
  }

  stop(sessionId: string, endedAt?: Date): Observable<TimeWorkedSessionDto | void> {
    return this.http.patch<TimeWorkedSessionDto>(`/api/timeworked/stop/${encodeURIComponent(sessionId)}`, { endedAt }).pipe(
      tap(() => this.subject.next(null)),
      catchError(() => of(undefined))
    );
  }

  getSnapshot(): TimeWorkedSessionDto | null { return this.subject.getValue(); }
}
