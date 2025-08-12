import { createReducer, on } from '@ngrx/store';
import * as TimerActions from './timer.actions';

export interface TimerState {
  timerActive: boolean;
  timerDisplay: string;
  timerSessionId: string | null;
  isConnected: boolean;
  pingTime: number | null;
}

export const initialState: TimerState = {
  timerActive: false,
  timerDisplay: '00:00:00',
  timerSessionId: null,
  isConnected: true,
  pingTime: null,
};

export const timerReducer = createReducer(
  initialState,
  on(TimerActions.startTimer, state => ({ ...state, timerActive: true, timerDisplay: '00:00:00' })),
  on(TimerActions.stopTimer, state => ({ ...state, timerActive: false })),
  on(TimerActions.timerStarted, (state, { sessionId }) => ({ ...state, timerSessionId: sessionId })),
  on(TimerActions.timerStopped, state => ({ ...state, timerSessionId: null })),
  on(TimerActions.setTimerDisplay, (state, { display }) => ({ ...state, timerDisplay: display })),
  on(TimerActions.setConnectionStatus, (state, { isConnected, pingTime }) => ({ ...state, isConnected, pingTime })),
);
