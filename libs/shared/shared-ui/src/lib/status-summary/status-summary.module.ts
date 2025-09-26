import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TfStatusSummaryComponent } from './status-summary.component';

@NgModule({
  imports: [CommonModule],
  declarations: [TfStatusSummaryComponent],
  exports: [TfStatusSummaryComponent],
})
export class StatusSummaryModule {}
