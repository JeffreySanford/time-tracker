import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

// NgRx
import { StoreModule } from '@ngrx/store';
import { timerReducer } from './store/timer.reducer';

// Angular Material
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { App } from './app';
import { CommitAnalyticsComponent } from './components/commit-analytics/commit-analytics.component';
import { CommitCategoryBarComponent } from './components/commit-category-bar/commit-category-bar.component';
import { CommitHeatmapComponent } from './components/commit-heatmap/commit-heatmap.component';
import { CommitSessionsTimelineComponent } from './components/commit-sessions-timeline/commit-sessions-timeline.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { PlanningComponent } from './components/planning/planning.component';
import { QuickEditDrawerComponent } from './components/quick-edit-drawer/quick-edit-drawer.component';
import { ReportsComponent } from './components/reports/reports.component';
import { SystemStatusComponent } from './components/system-status/system-status.component';
import { HomeComponent } from './home.component';
import { StatusSummaryModule } from '@time-tracker/shared-ui';

@NgModule({
  declarations: [
    App,
    HomeComponent,
    HeaderComponent,
    FooterComponent,
    ReportsComponent,
    PlanningComponent,
    QuickEditDrawerComponent,
    CommitAnalyticsComponent,
    CommitHeatmapComponent,
    CommitCategoryBarComponent,
    CommitSessionsTimelineComponent,
    SystemStatusComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatSortModule,
    MatSidenavModule,
    MatTooltipModule,
    MatSnackBarModule,
    DragDropModule,
    StoreModule.forRoot({ timer: timerReducer }),
    RouterModule.forRoot([
      { path: '', component: HomeComponent },
      { path: 'commit-analytics', component: CommitAnalyticsComponent },
    ]),
    StatusSummaryModule,
  ],
  bootstrap: [App],
})
export class AppModule {}
