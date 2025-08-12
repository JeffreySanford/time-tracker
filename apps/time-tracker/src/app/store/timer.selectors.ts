import { createSelector, createFeatureSelector } from '@ngrx/store';
import { TimerState } from './timer.reducer';

export const selectTimerState = createFeatureSelector<TimerState>('timer');

export const selectTimerActive = createSelector(selectTimerState, state => state.timerActive);
export const selectTimerDisplay = createSelector(selectTimerState, state => state.timerDisplay);
export const selectTimerSessionId = createSelector(selectTimerState, state => state.timerSessionId);
export const selectIsConnected = createSelector(selectTimerState, state => state.isConnected);
export const selectPingTime = createSelector(selectTimerState, state => state.pingTime);
