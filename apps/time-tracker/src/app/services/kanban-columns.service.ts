import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface KanbanColumnDto { id?: string; name?: string }

@Injectable({ providedIn: 'root' })
export class KanbanColumnsService {
  private subject = new BehaviorSubject<KanbanColumnDto[] | null>(null);
  readonly columns$ = this.subject.asObservable();

  private readonly http = inject(HttpClient);

  refresh(): Observable<KanbanColumnDto[] | null> {
    return this.http.get<KanbanColumnDto[]>('/api/kanban-columns').pipe(
      tap(data => this.subject.next(data)),
      catchError(() => {
        this.subject.next(null);
        return of(null);
      })
    );
  }

  fetch(): Observable<KanbanColumnDto[] | null> { return this.columns$; }

  getSnapshot(): KanbanColumnDto[] | null { return this.subject.getValue(); }

  // Persist a new ordering of columns (server should accept an array of ids in order)
  updateOrder(orderIds: string[]): Observable<void> {
    return this.http.post<void>('/api/kanban-columns/order', { order: orderIds }).pipe(
      tap(() => {
        // optimistic local update of cached columns to match the new order
        const current = this.subject.getValue() || [];
        const map = new Map(current.map(c => [c.id, c] as const));
        const next = orderIds.map(id => map.get(id) || { id, name: id });
        this.subject.next(next as KanbanColumnDto[]);
      })
    );
  }
}
