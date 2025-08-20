import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface UserDto { id?: string; name?: string; email?: string; avatarUrl?: string; role?: string }

@Injectable({ providedIn: 'root' })
export class UsersService {
  private subject = new BehaviorSubject<UserDto[] | null>(null);
  readonly users$ = this.subject.asObservable();

  private readonly http = inject(HttpClient);

  refresh(): Observable<UserDto[] | null> {
    return this.http.get<UserDto[]>('/api/users').pipe(
      tap(data => this.subject.next(data)),
      catchError(() => {
        this.subject.next(null);
        return of(null);
      })
    );
  }

  fetch(): Observable<UserDto[] | null> { return this.users$; }

  getSnapshot(): UserDto[] | null { return this.subject.getValue(); }
}
