import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { map, mergeMap, catchError, withLatestFrom } from 'rxjs/operators';
import { of } from 'rxjs';
import * as TimerActions from './timer.actions';
import { selectTimerSessionId } from './timer.selectors';

@Injectable()
export class TimerEffects {
  private actions$ = inject(Actions);
  private http = inject(HttpClient);
  private store = inject(Store);

  startTimer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TimerActions.startTimer),
      mergeMap(() =>
        this.http.post<{ _id: string }>(
          '/api/timeworked/start', { userId: 'demo-user' }
        ).pipe(
          map(session => TimerActions.timerStarted({ sessionId: session._id })),
          catchError(() => of(TimerActions.timerStopped({ sessionId: '' })))
        )
      )
    )
  );

  stopTimer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TimerActions.stopTimer),
      withLatestFrom(this.store.select(selectTimerSessionId)),
      mergeMap(([action, sessionId]) => {
        if (!sessionId) return of(TimerActions.timerStopped({ sessionId: '' }));
        return this.http.patch<{ _id: string }>(
          `/api/timeworked/stop/${sessionId}`,
          { endedAt: new Date() }
        ).pipe(
          map(() => TimerActions.timerStopped({ sessionId })),
          catchError(() => of(TimerActions.timerStopped({ sessionId: '' })))
        );
      })
    )
  );

  pingServer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TimerActions.pingServer),
      mergeMap(() => {
        const start = performance.now();
        return this.http.get('/api/health', { observe: 'response' }).pipe(
          map(response => TimerActions.setConnectionStatus({
            isConnected: response.status === 200,
            pingTime: Math.round(performance.now() - start)
          })),
          catchError(() => of(TimerActions.setConnectionStatus({
            isConnected: false,
            pingTime: Math.round(performance.now() - start)
          })))
        );
      })
    )
  );
}
