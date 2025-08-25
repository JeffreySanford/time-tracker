import { Component, Input } from '@angular/core';
import { CategorySummary } from '../../services/commit-analytics.service';

@Component({
  selector: 'app-commit-category-bar',
  standalone: false,
  template: `
  <div *ngIf="categories?.length">
    <div *ngFor="let c of categories" class="row">
      <span class="label">{{c.category}}</span>
      <div class="bar-wrapper"><div class="bar" [style.width.%]="percent(c.minutes)" ></div></div>
      <span class="minutes">{{c.minutes | number}}m</span>
    </div>
  </div>
  `,
  styles: [`.row{display:flex;align-items:center;gap:8px;margin:2px 0}.label{width:80px;font-size:12px;text-transform:capitalize}.bar-wrapper{flex:1;background:#eee;height:8px;border-radius:4px;overflow:hidden}.bar{background:#4a90e2;height:100%}.minutes{font-size:11px;color:#555}`]
})
export class CommitCategoryBarComponent {
  @Input() categories: CategorySummary[] | null = null;
  total(): number { return (this.categories||[]).reduce((s,c)=>s+c.minutes,0); }
  percent(m: number) { const t = this.total() || 1; return (m / t) * 100; }
}
