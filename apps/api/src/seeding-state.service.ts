import { Injectable } from '@nestjs/common';

@Injectable()
export class SeedingStateService {
  private _started = false;
  private _completed = false;
  private _errors: string[] = [];
  markStarted() { this._started = true; }
  markCompleted() { this._completed = true; }
  markError(err: unknown) { this._errors.push(String(err)); }
  get snapshot() { return { started: this._started, completed: this._completed, errors: this._errors }; }
}
