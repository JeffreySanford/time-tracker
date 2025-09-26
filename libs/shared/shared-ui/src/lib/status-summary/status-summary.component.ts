import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export interface StatusSummaryItem {
  id: string;
  label: string;
  color: string;
  count: number;
  cssClass?: string;
}

@Component({
  selector: 'app-status-summary',
  standalone: false,
  // Keep the original selector so existing templates continue to work
  template: `
    <div class="status-summary" *ngIf="items?.length">
      <div
        class="status-summary-item"
        *ngFor="let item of items"
        [class]="'status-summary-item ' + (item.cssClass || item.id)"
        [style.--status-color]="item.color"
      >
        <span class="value">{{ item.count }}</span>
        <span class="label">{{ item.label }}</span>
      </div>
    </div>
  `,
  styles: [
    `
      .status-summary {
        display: flex;
        flex-wrap: wrap;
        gap: 0.9rem;
      }
      .status-summary-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0.9rem 1.1rem;
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(10px);
        border-radius: 14px;
        min-width: 78px;
        border: 1px solid rgba(255, 255, 255, 0.55);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
        transition: all 0.25s ease;
        position: relative;
        overflow: hidden;
      }
      .status-summary-item:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
      }
      .status-summary-item .value {
        font-size: 1.55rem;
        font-weight: 800;
        margin-bottom: 0.15rem;
        line-height: 1;
        color: #1f2937;
      }
      .status-summary-item .label {
        font-size: 0.65rem;
        letter-spacing: 0.08em;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
      }
      .status-summary-item.backlog {
        border-color: rgba(245, 158, 11, 0.35);
      }
      .status-summary-item.backlog .value {
        color: #f59e0b;
      }
      .status-summary-item.active {
        border-color: rgba(59, 130, 246, 0.35);
      }
      .status-summary-item.active .value {
        color: #3b82f6;
      }
      .status-summary-item.done {
        border-color: rgba(16, 185, 129, 0.35);
      }
      .status-summary-item.done .value {
        color: #10b981;
      }
      .status-summary-item.extended {
        border-color: rgba(100, 116, 139, 0.35);
      }
      .status-summary-item.extended .value {
        color: var(--status-color, #64748b);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TfStatusSummaryComponent {
  @Input() items: StatusSummaryItem[] = [];
}

// Module moved to status-summary.module.ts
