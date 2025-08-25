import { Component, Input } from '@angular/core';

export interface SessionVM { startTs: string; endTs: string; totalEstimatedMinutes: number; categoriesSummary: Record<string, number>; commitCount: number; }

@Component({
  selector: 'app-commit-sessions-timeline',
  standalone: false,
  template: `
  <div class="timeline" *ngIf="sessions?.length">
    <div *ngFor="let s of sessions" class="session" [title]="tooltip(s)">
      <div class="bar" [style.flexGrow]="s.totalEstimatedMinutes"></div>
      <div class="meta">{{formatRange(s)}} ({{s.totalEstimatedMinutes}}m / {{s.commitCount}} commits)</div>
    </div>
  </div>
  `,
  styles: [`.timeline{display:flex;flex-direction:column;gap:6px}.session{display:flex;align-items:center;gap:8px}.bar{height:10px;background:linear-gradient(90deg,#4a90e2,#6fb4ff);border-radius:4px;min-width:10px}.meta{font-size:11px;color:#444}`]
})
export class CommitSessionsTimelineComponent {
  @Input() sessions: SessionVM[] | null = null;
  formatRange(s: SessionVM) { const st = new Date(s.startTs); const et = new Date(s.endTs); return `${st.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}-${et.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`; }
  tooltip(s: SessionVM) { return Object.entries(s.categoriesSummary).map(([k,v])=>`${k}: ${v}m`).join('\n'); }
}
