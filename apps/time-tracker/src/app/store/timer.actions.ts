import { createAction, props } from '@ngrx/store';

export const startTimer = createAction('[Timer] Start');
export const stopTimer = createAction('[Timer] Stop');
export const timerStarted = createAction('[Timer] Started', props<{ sessionId: string }>());
export const timerStopped = createAction('[Timer] Stopped', props<{ sessionId: string }>());
export const setTimerDisplay = createAction('[Timer] Set Display', props<{ display: string }>());
export const pingServer = createAction('[Health] Ping');
export const setConnectionStatus = createAction('[Health] Set Connection', props<{ isConnected: boolean; pingTime: number | null }>());
