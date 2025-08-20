import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface TagDto { id?: string; name?: string; color?: string }

@Injectable({ providedIn: 'root' })
export class TagsService {
  private subject = new BehaviorSubject<TagDto[] | null>(null);
  readonly tags$ = this.subject.asObservable();

  constructor(private readonly http: HttpClient) {}

  refresh(): Observable<TagDto[] | null> {
    return this.http.get<TagDto[]>('/api/tags').pipe(
      tap(data => this.subject.next(data)),
      catchError(err => {
        this.subject.next(null);
        return of(null);
      })
    );
  }

  fetch(): Observable<TagDto[] | null> { return this.tags$; }

  getSnapshot(): TagDto[] | null { return this.subject.getValue(); }
}
