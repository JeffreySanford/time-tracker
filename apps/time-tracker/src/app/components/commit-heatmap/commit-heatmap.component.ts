import { Component, Input } from '@angular/core';
import { CommitDay } from '../../services/commit-analytics.service';

@Component({
  selector: 'app-commit-heatmap',
  standalone: false,
  template: `
  <div class="heatmap" *ngIf="days?.length">
    <div class="cell" *ngFor="let d of days" [title]="d.date + ': ' + d.minutes + 'm'" [style.background]="color(d.minutes)"></div>
  </div>
  `,
  styles: [`.heatmap{display:grid;grid-template-columns:repeat(auto-fill,8px);gap:2px}.cell{width:8px;height:8px;border-radius:2px}`]
})
export class CommitHeatmapComponent {
  @Input() days: CommitDay[] | null = null;
  color(m: number) {
    if (m <= 0) return '#eee';
    const capped = Math.min(m, 240); // cap 4h
    const intensity = Math.round((capped / 240) * 200) + 30;
    return `rgb(40,120,200,${0.2 + intensity/255 * 0.8})`;
  }
}
