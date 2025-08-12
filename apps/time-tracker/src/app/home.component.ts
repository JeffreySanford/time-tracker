import { Component, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false
})
export class HomeComponent implements OnDestroy {
  todayString: string;
  isConnected = true;
  pingTime: number | null = null;

  timerActive = false;
  timerDisplay = '00:00:00';
  timerInterval: ReturnType<typeof setInterval> | null = null;
  timerStart = 0;
  timerSessionId: string | null = null;

  startSubject = new Subject<void>();
  stopSubject = new Subject<void>();
  pingSubject = new Subject<void>();
  subscriptions: Subscription[] = [];

  http = inject(HttpClient);

  constructor() {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    this.todayString = today.toLocaleDateString(undefined, options);

    this.subscriptions.push(
      this.startSubject.subscribe(() => {
        this.timerActive = true;
        this.timerStart = Date.now();
        this.timerDisplay = '00:00:00';
        const sub = this.http.post<{ _id: string; userId: string; startedAt: string; endedAt: string | null; duration: number }>(
          '/api/timeworked/start', { userId: 'demo-user' })
          .subscribe({
            next: (session) => {
              this.timerSessionId = session._id;
              console.log('Timer session started:', session);
              this.timerInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - this.timerStart) / 1000);
                this.timerDisplay = this.formatTime(elapsed);
              }, 1000);
            },
            error: (err) => {
              console.error('Error starting timer session:', err);
            }
          });
        this.subscriptions.push(sub);
      })
    );

    this.subscriptions.push(
      this.stopSubject.subscribe(() => {
        this.timerActive = false;
        if (this.timerInterval !== null) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
        if (this.timerSessionId) {
          const sub = this.http.patch<{ _id: string; userId: string; startedAt: string; endedAt: string | null; duration: number }>(
            `/api/timeworked/stop/${this.timerSessionId}`, { endedAt: new Date() })
            .subscribe({
              next: (result) => {
                console.log('Timer session stopped:', result);
                this.timerSessionId = null;
              },
              error: (err) => {
                console.error('Error stopping timer session:', err);
              }
            });
          this.subscriptions.push(sub);
        }
      })
    );

    this.subscriptions.push(
      this.pingSubject.subscribe(() => {
        const start = performance.now();
        const sub = this.http.get('/api/health', { observe: 'response' })
          .subscribe({
            next: (response) => {
              this.isConnected = response.status === 200;
              this.pingTime = Math.round(performance.now() - start);
            },
            error: () => {
              this.isConnected = false;
              this.pingTime = Math.round(performance.now() - start);
            }
          });
        this.subscriptions.push(sub);
      })
    );
  }

  startTimer() {
    this.startSubject.next();
  }

  stopTimer() {
    this.stopSubject.next();
  }

  formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  pingServer() {
    this.pingSubject.next();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
