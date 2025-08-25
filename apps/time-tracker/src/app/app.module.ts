import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { App } from './app';
import { HomeComponent } from './home.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { ReportsComponent } from './components/reports/reports.component';
import { CommitAnalyticsComponent } from './components/commit-analytics/commit-analytics.component';
import { CommitHeatmapComponent } from './components/commit-heatmap/commit-heatmap.component';
import { CommitCategoryBarComponent } from './components/commit-category-bar/commit-category-bar.component';
import { CommitSessionsTimelineComponent } from './components/commit-sessions-timeline/commit-sessions-timeline.component';
import { PlanningComponent } from './components/planning/planning.component';
import { QuickEditDrawerComponent } from './components/quick-edit-drawer/quick-edit-drawer.component';

@NgModule({
  declarations: [
    App,
    HomeComponent,
    HeaderComponent,
    FooterComponent,
    ReportsComponent,
  PlanningComponent,
  CommitAnalyticsComponent,
  CommitHeatmapComponent,
  CommitCategoryBarComponent,
  CommitSessionsTimelineComponent
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
    RouterModule.forRoot([
      { path: '', component: HomeComponent },
      { path: 'commit-analytics', component: CommitAnalyticsComponent }
    ]),
    // register standalone component
    QuickEditDrawerComponent
  ],
  bootstrap: [App],
})
export class AppModule {}
