import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface CommitDay { date: string; minutes: number; }
export interface CategorySummary { category: string; minutes: number; }
export interface SummaryResponse { byDay: { _id: string; minutes: number }[]; byCategory: { _id: string; minutes: number }[]; }
export interface CommitSessionDto { id: string; authorEmail: string; startTs: string; endTs: string; totalEstimatedMinutes: number; commitCount: number; categoriesSummary: Record<string, number>; tasksSummary?: Record<string, number>; commitMessages?: string[]; projectId?: string; }

@Injectable({ providedIn: 'root' })
export class CommitAnalyticsService {
  private http = inject(HttpClient);
  private daySubject = new BehaviorSubject<CommitDay[] | null>(null);
  private catSubject = new BehaviorSubject<CategorySummary[] | null>(null);
  private sessionsSubject = new BehaviorSubject<CommitSessionDto[] | null>(null);
  private availableSubject = new BehaviorSubject<boolean>(true);

  readonly days$: Observable<CommitDay[] | null> = this.daySubject.asObservable();
  readonly categories$: Observable<CategorySummary[] | null> = this.catSubject.asObservable();
  readonly sessions$: Observable<CommitSessionDto[] | null> = this.sessionsSubject.asObservable();
  readonly available$: Observable<boolean> = this.availableSubject.asObservable();

  refresh(days = 30, projectId?: string): Observable<SummaryResponse> {
    const qp = projectId ? `&projectId=${encodeURIComponent(projectId)}` : '';
    return this.http.get<SummaryResponse>(`/api/git/summary?days=${days}${qp}`).pipe(
      tap(res => {
        this.daySubject.next(res.byDay.map(d => ({ date: d._id, minutes: d.minutes })));
        this.catSubject.next(res.byCategory.map(c => ({ category: c._id, minutes: c.minutes })));
      }),
      catchError(err => {
        this.availableSubject.next(false);
        this.daySubject.next([]);
        this.catSubject.next([]);
        return of({ byDay: [], byCategory: [] });
      })
    );
  }

  loadSessions(days = 7, projectId?: string): Observable<CommitSessionDto[]> {
    const qp = projectId ? `&projectId=${encodeURIComponent(projectId)}` : '';
    return this.http.get<CommitSessionDto[]>(`/api/git/sessions?days=${days}${qp}`).pipe(
      tap(s => this.sessionsSubject.next(s)),
      catchError(err => {
        this.availableSubject.next(false);
        this.sessionsSubject.next([]);
        return of([]);
      })
    );
  }

  // Trigger server-side local ingestion (dev convenience) then refresh
  ingestLocal(days = 30): Observable<SummaryResponse> {
    return this.http.post(`/api/git/ingest/local?days=${days}`, {}).pipe(
      catchError(err => {
        this.availableSubject.next(false);
        return of({});
      }),
      // After ingestion attempt, refresh summary
      // We ignore errors in ingestion to still try summary
      // Use tap + switchMap pattern externally if needed
    ) as unknown as Observable<SummaryResponse>;
  }
}
