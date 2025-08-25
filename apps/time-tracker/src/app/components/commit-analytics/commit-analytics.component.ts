import { Component, OnInit, inject } from '@angular/core';
import { CommitAnalyticsService } from '../../services/commit-analytics.service';

@Component({
  selector: 'app-commit-analytics',
  standalone: false,
  template: `
  <div class="commit-analytics">
    <h2>Commit-based Activity</h2>
    <section>
      <h3>Calendar Heatmap (Last 30 Days)</h3>
      <app-commit-heatmap [days]="days$ | async"></app-commit-heatmap>
    </section>
    <section>
      <h3>Category Breakdown</h3>
      <app-commit-category-bar [categories]="categories$ | async"></app-commit-category-bar>
    </section>
    <section *ngIf="(sessions$ | async) as sessions">
      <h3>Recent Sessions</h3>
      <app-commit-sessions-timeline [sessions]="sessions"></app-commit-sessions-timeline>
    </section>
  </div>
  `,
  styles: [`.commit-analytics h2{margin-top:0}.commit-analytics section{margin-bottom:24px}`]
})
export class CommitAnalyticsComponent implements OnInit {
  private svc = inject(CommitAnalyticsService);
  days$ = this.svc.days$;
  categories$ = this.svc.categories$;
  sessions$ = this.svc.sessions$;
  ngOnInit() { this.svc.refresh().subscribe(); this.svc.loadSessions().subscribe(); }
}
