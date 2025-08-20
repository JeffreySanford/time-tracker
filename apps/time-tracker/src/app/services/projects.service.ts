import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface ProjectDto { id?: string; name?: string; color?: string; bgColor?: string; description?: string }

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private subject = new BehaviorSubject<ProjectDto[] | null>(null);
  readonly projects$ = this.subject.asObservable();

  constructor(private readonly http: HttpClient) {}

  // Trigger a fresh load from the API and update the hot stream
  refresh(): Observable<ProjectDto[] | null> {
    return this.http.get<ProjectDto[]>('/api/projects').pipe(
      tap(data => this.subject.next(data)),
      catchError(err => {
        this.subject.next(null);
        return of(null);
      })
    );
  }

  // Backwards-compatible API: returns the hot observable (BehaviorSubject) instead of a cold HTTP call
  fetch(): Observable<ProjectDto[] | null> { return this.projects$; }

  // Helper to synchronously read the current cache value
  getSnapshot(): ProjectDto[] | null { return this.subject.getValue(); }
}
