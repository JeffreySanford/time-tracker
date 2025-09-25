import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { TimeWorkedApiService, TimeWorkedSessionDto } from '../services/timeworked-api.service';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { map, mergeMap, catchError, withLatestFrom } from 'rxjs/operators';
import { of } from 'rxjs';
import * as TimerActions from './timer.actions';
import { selectTimerSessionId } from './timer.selectors';

@Injectable()
export class TimerEffects {
  private actions$ = inject(Actions);
  private timeWorked = inject(TimeWorkedApiService);
  private http = inject(HttpClient);
  private store = inject(Store);

  startTimer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TimerActions.startTimer),
      mergeMap(() =>
        this.timeWorked.start('demo-user').pipe(
          map((session: TimeWorkedSessionDto | void) => {
            if (!session) return TimerActions.timerStarted({ sessionId: '' });
            return TimerActions.timerStarted({ sessionId: session._id });
          }),
          catchError(() => of(TimerActions.timerStopped({ sessionId: '' })))
        )
      )
    )
  );

  stopTimer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TimerActions.stopTimer),
      withLatestFrom(this.store.select(selectTimerSessionId)),
  mergeMap(([ , sessionId]) => {
        if (!sessionId) return of(TimerActions.timerStopped({ sessionId: '' }));
        return this.timeWorked.stop(sessionId, new Date()).pipe(
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
        type HttpHealthResponse = { status?: string } | Record<string, unknown>;
        return this.http.get<HttpHealthResponse>('/api/health', { observe: 'response' }).pipe(
          map((response: HttpResponse<HttpHealthResponse>) => TimerActions.setConnectionStatus({
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
