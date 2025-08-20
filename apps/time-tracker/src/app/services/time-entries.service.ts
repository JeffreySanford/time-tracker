import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface TimeEntryDto { id?: string; date?: string; project?: string; timeSpent?: number; description?: string }

@Injectable({ providedIn: 'root' })
export class TimeEntriesService {
  private subject = new BehaviorSubject<TimeEntryDto[] | null>(null);
  readonly timeEntries$ = this.subject.asObservable();

  private readonly http = inject(HttpClient);

  refresh(): Observable<TimeEntryDto[] | null> {
    return this.http.get<TimeEntryDto[]>('/api/time-entries').pipe(
      tap(data => this.subject.next(data)),
      catchError(() => {
        this.subject.next(null);
        return of(null);
      })
    );
  }

  fetch(): Observable<TimeEntryDto[] | null> { return this.timeEntries$; }

  getSnapshot(): TimeEntryDto[] | null { return this.subject.getValue(); }
}
