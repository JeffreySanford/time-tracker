import { Component, Input, Output, EventEmitter, AfterViewInit, OnChanges, SimpleChanges, ViewChild, inject } from '@angular/core';
import { from } from 'rxjs';
import { TaskApiService, TaskDto } from '../../services/task-api.service';
import { MatSidenav } from '@angular/material/sidenav';
import timeEntriesData from '../../../assets/timeEntries.json';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Project } from '../../models/project.model';

interface Task {
  id: string;
  title: string;
  description: string;
  project: string;
  tags: string[];
  status: 'active' | 'completed' | 'backlog';
  timeSpent: number;
  startTime?: Date;
  endTime?: Date;
  createdAt: Date;
}

interface TimeEntry {
  id: string;
  date: Date;
  project: string;
  timeSpent: number;
  description: string;
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
    // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false
})
export class ReportsComponent implements AfterViewInit, OnChanges {
  @Input() projects: Project[] = [];
  @Input() tasks: Task[] = [];
  @Input() selectedProject!: Project; // Will always be provided by parent
  @Output() projectChange = new EventEmitter<Project>();
  @Output() taskChange = new EventEmitter<Task>();

  // Material table wiring
  displayedColumns: string[] = ['date', 'project', 'description', 'timeSpent', 'status'];
  dataSource = new MatTableDataSource<TimeEntry>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('taskSidenav') taskSidenav!: MatSidenav;

  // Sample time entries for demonstration
  // Optional static entries (kept for demo). Most data is now derived from `tasks` input.
  // Raw seed entries loaded from assets/timeEntries.json — we'll convert at runtime
  rawTimeEntries: unknown[] = (timeEntriesData as unknown[]);
  timeEntries: TimeEntry[] = []; // will be materialized in allTimeEntries getter

  reportPeriod = '7'; // 7 days
  showProjectSelector = false;
  // Billing
  hourlyRate = 100; // default rate (USD per hour) — can be edited in UI

  get billableMinutes(): number {
    // Sum minutes of entries marked billable within the filtered entries
    // Note: timeEntries.json uses minutes; our internal entries use seconds
    const raw = this.rawTimeEntries as Array<Record<string, unknown>>;
    const minutes = this.filteredTimeEntries.reduce((sum, e) => {
      const r = raw.find(r => String(r['id'] ?? '') === e.id);
      if (r && (r['billable'] === true)) {
        const m = typeof r['minutes'] === 'number' ? (r['minutes'] as number) : Number(r['minutes'] ?? 0);
        return sum + (isFinite(m) ? m : 0);
      }
      return sum;
    }, 0);
    return minutes;
  }

  get billableAmount(): number {
    return (this.billableMinutes / 60) * this.hourlyRate;
  }

  http = inject(TaskApiService);

  constructor() {
    // customize filter behavior to search date, project name, description and formatted time
    this.dataSource.filterPredicate = (data: TimeEntry, filter: string) => {
      const f = filter.trim().toLowerCase();
      const projectName = this.getProjectName(data.project).toLowerCase();
      const desc = (data.description || '').toLowerCase();
      const dateStr = this.formatDate(new Date(data.date)).toLowerCase();
      const timeStr = this.formatTime(data.timeSpent).toLowerCase();
      return projectName.includes(f) || desc.includes(f) || dateStr.includes(f) || timeStr.includes(f);
    };
  }

  get filteredTimeEntries(): TimeEntry[] {
    const days = parseInt(this.reportPeriod);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    // Combine manual entries with ones derived from tasks
    let entries = this.allTimeEntries.filter(entry => entry.date >= cutoffDate);
    
    if (this.selectedProject && this.selectedProject.id) {
      entries = entries.filter(entry => entry.project === this.selectedProject.id);
    }
    
    return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  ngAfterViewInit(): void {
    // attach paginator & sort after view init
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnChanges(changes: SimpleChanges): void {
    // update the table whenever inputs change
    if (changes['tasks'] || changes['reportPeriod'] || changes['selectedProject']) {
      this.updateTable();
    }
  }

  private updateTable() {
    const rows = this.filteredTimeEntries.map(e => ({ ...e }));
    this.dataSource.data = rows;
    if (this.paginator) this.paginator.firstPage();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  // Build time entries from tasks input so the reports are immediately useful
  get allTimeEntries(): TimeEntry[] {
    // Build entries from raw timeEntries.json when present
    const raws = (this.rawTimeEntries || []) as Array<Record<string, unknown>>;
    const fromRaw: TimeEntry[] = raws.map(r => {
      const id = String(r['id'] ?? '');
      const start = typeof r['start'] === 'string' ? new Date(r['start'] as string) : new Date();
      const minutes = typeof r['minutes'] === 'number' ? (r['minutes'] as number) : Number(r['minutes'] ?? 0);
      const taskId = String(r['taskId'] ?? '');
      // try to resolve task -> project
      const task = (this.tasks || []).find(t => t.id === taskId);
      const project = task ? task.project : String(r['project'] ?? '');
      return {
        id,
        date: start,
        project,
        timeSpent: (isFinite(minutes) ? minutes * 60 : 0),
        description: String(r['description'] ?? '')
      } as TimeEntry;
    });

    // Also include task-derived entries for tasks that have timeSpent but no explicit timeEntry
    const fromTasks: TimeEntry[] = (this.tasks || [])
      .filter(t => typeof t.timeSpent === 'number' && t.timeSpent > 0 && !raws.find(r => String(r['taskId'] ?? '') === t.id))
      .map(t => ({
        id: t.id,
        date: t.createdAt ? new Date(t.createdAt) : new Date(),
        project: t.project,
        timeSpent: t.timeSpent,
        description: t.description
      }));

    return [...fromRaw, ...fromTasks];
  }

  // Counts of tasks by status for quick status summary
  status: 'active' | 'completed' | 'backlog' = 'backlog';

  get statusCounts(): { active: number; completed: number; backlog: number } {
    const counts = { active: 0, completed: 0, backlog: 0 };
    (this.tasks || []).forEach(t => {
      if (t.status === 'active') counts.active += 1;
      else if (t.status === 'completed') counts.completed += 1;
      else if (t.status === 'backlog') counts.backlog += 1;
    });
    return counts;
  }

  // Top tasks in the current filter (by time spent)
  get topTasks(): Task[] {
    return (this.tasks || [])
      .filter(t => t.timeSpent > 0 && this.filteredTimeEntries.some(e => e.id === t.id))
      .sort((a, b) => b.timeSpent - a.timeSpent)
      .slice(0, 5);
  }

  // Daily totals for the selected period (useful for a small sparkline/list)
  get dailyTotals(): { date: Date; time: number }[] {
    const days = parseInt(this.reportPeriod);
    const totals = new Map<string, number>();
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      totals.set(d.toDateString(), 0);
    }

    this.filteredTimeEntries.forEach(e => {
      const key = new Date(e.date).toDateString();
      totals.set(key, (totals.get(key) || 0) + e.timeSpent);
    });

    return Array.from(totals.entries())
      .map(([k, v]) => ({ date: new Date(k), time: v }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // Daily billable vs non-billable breakdown based on rawTimeEntries and derived task entries
  get dailyBillableBreakdown(): { date: Date; billable: number; nonBillable: number }[] {
    const days = parseInt(this.reportPeriod);
    const now = new Date();
    const map = new Map<string, { billable: number; nonBillable: number }>();

    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      map.set(d.toDateString(), { billable: 0, nonBillable: 0 });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const raws = (this.rawTimeEntries || []) as Array<Record<string, unknown>>;

    // Process raw time entries first (they have billable flag and minutes)
    raws.forEach(r => {
      const start = typeof r['start'] === 'string' ? new Date(r['start'] as string) : undefined;
      if (!start) return;
      if (start < cutoffDate) return;

      // resolve project filter
      let project = String(r['project'] ?? '');
      const taskId = String(r['taskId'] ?? '');
      if (taskId) {
        const task = (this.tasks || []).find(t => t.id === taskId);
        if (task) project = task.project;
      }
      if (this.selectedProject && this.selectedProject.id && project && project !== this.selectedProject.id) return;

      const key = start.toDateString();
      const entry = map.get(key);
      if (!entry) return;
      const minutes = typeof r['minutes'] === 'number' ? (r['minutes'] as number) : Number(r['minutes'] ?? 0);
      if (r['billable'] === true) {
        entry.billable += isFinite(minutes) ? minutes : 0;
      } else {
        entry.nonBillable += isFinite(minutes) ? minutes : 0;
      }
      map.set(key, entry);
    });

    // Process derived entries (task-derived) — treat them as non-billable by default unless a raw entry exists for the task
    this.filteredTimeEntries.forEach(e => {
      const rawMatch = raws.find(r => String(r['id'] ?? '') === e.id || String(r['taskId'] ?? '') === e.id);
      if (rawMatch) return; // already counted
      const key = new Date(e.date).toDateString();
      const entry = map.get(key);
      if (!entry) return;
      entry.nonBillable += Math.round(e.timeSpent / 60);
      map.set(key, entry);
    });

    return Array.from(map.entries())
      .map(([k, v]) => ({ date: new Date(k), billable: v.billable, nonBillable: v.nonBillable }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // Produce a simple SVG sparkline path from dailyTotals (small inline sparkline)
  get sparklinePath(): { path: string; width: number; height: number } {
    const points = this.dailyTotals.map(d => d.time);
    const width = Math.max(60, points.length * 10);
    const height = 32;
    const max = Math.max(...points, 1);

    const coords = points.map((val, i) => {
      const x = (i / Math.max(1, points.length - 1)) * (width - 2) + 1;
      const y = height - (val / max) * (height - 4) - 2;
      return `${x},${y}`;
    });

    const path = coords.length ? `M ${coords.join(' L ')}` : '';
    return { path, width, height };
  }

  get totalTimeSpent(): number {
    return this.filteredTimeEntries.reduce((total, entry) => total + entry.timeSpent, 0);
  }

  get averageTimePerDay(): number {
    const uniqueDates = [...new Set(this.filteredTimeEntries.map(entry => 
      entry.date.toDateString()))];
    return uniqueDates.length > 0 ? this.totalTimeSpent / uniqueDates.length : 0;
  }

  get projectBreakdown(): { project: string; time: number; percentage: number }[] {
    const breakdown = new Map<string, number>();
    
    this.filteredTimeEntries.forEach(entry => {
      const current = breakdown.get(entry.project) || 0;
      breakdown.set(entry.project, current + entry.timeSpent);
    });
    
    const total = this.totalTimeSpent;
    return Array.from(breakdown.entries()).map(([project, time]) => ({
      project,
      time,
      percentage: total > 0 ? (time / total) * 100 : 0
    }));
  }

  toggleProjectSelector() {
    this.showProjectSelector = !this.showProjectSelector;
  }

  selectProject(project: Project) {
    this.selectedProject = project;
    this.showProjectSelector = false;
    this.projectChange.emit(project);
  }

  onPeriodChange() {
    // Recalculate filtered data and refresh the table when the period changes
    this.updateTable();
  }

  get periodLabel(): string {
    const map: Record<string, string> = { '1': 'Today', '7': 'This Week', '30': 'This Month', '90': 'Last 3 Months' };
    return map[this.reportPeriod] || `${this.reportPeriod} days`;
  }

  // Formatted total time for the selected period (large clock display)
  get periodTotalFormatted(): string {
    return this.formatTime(this.totalTimeSpent);
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString(undefined, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  getProjectName(projectId: string): string {
    const project = this.projects.find(p => p.id === projectId);
    return project ? project.name.substring(2) : projectId;
  }

  getProjectColor(projectId: string): string {
    const project = this.projects.find(p => p.id === projectId);
    return project ? project.color ?? '#667eea' : '#667eea';
  }

  getTaskStatus(entryId: string): string {
    const t = (this.tasks || []).find(task => task.id === entryId);
    return t ? t.status : '-';
  }

  // Drawer state for quick-edit
  selectedTask: Task | null = null;

  openTaskDrawer(task: Task) {
    // shallow clone so edits are isolated until save
    this.selectedTask = { ...task };
    // open the sidenav after a tick so Angular has applied the selectedTask binding
    setTimeout(() => this.taskSidenav?.open?.());
  }

  closeTaskDrawer() {
    // close the sidenav and clear selection when closed
    if (this.taskSidenav) {
      from(this.taskSidenav.close()).subscribe(() => {
        this.selectedTask = null;
      });
    } else {
      this.selectedTask = null;
    }
  }

  saveTaskEdits() {
    if (!this.selectedTask) return;
    const edited = this.selectedTask;
    const idx = (this.tasks || []).findIndex(t => t.id === edited.id);
    if (idx >= 0) {
      // optimistic update
      const previous = { ...this.tasks[idx] };
      this.tasks[idx] = { ...edited } as Task;
      // persist to backend
  this.http.persistTask(edited as TaskDto).subscribe({
        error: (err) => {
          // revert optimistic update on error
          this.tasks[idx] = previous;
          console.error('Failed to save task edits', err);
        }
      });
    } else {
      // create new task on server (optimistic add)
      this.tasks = [...(this.tasks || []), edited as Task];
      this.http.persistTask(edited as TaskDto).subscribe({
        next: (res: TaskDto | void) => {
          if (res && res.id) {
            const i = this.tasks.findIndex(t => t.id === edited.id);
            if (i >= 0) this.tasks[i] = { ...res } as Task;
          }
        },
        error: (err) => {
          // remove the optimistic add
          this.tasks = (this.tasks || []).filter(t => t.id !== edited.id);
          console.error('Failed to create task', err);
        }
      });
    }
    this.taskChange.emit(edited as Task);
    this.updateTable();
    this.closeTaskDrawer();
  }

  // Handlers used by the QuickEditDrawer component
  handleDrawerSave(event: unknown) {
    // Template typing can sometimes infer $event as Event; cast to TaskDto defensively
    const taskDto = event as TaskDto;
    // reuse existing save logic but with the selectedTask payload
    this.selectedTask = { ...taskDto } as Task;
    this.saveTaskEdits();
  }

  handleDrawerCancel() {
    this.closeTaskDrawer();
  }

  // Build a tooltip string for entries on a given day (includes raw timeEntries and derived tasks)
  getEntriesTextForDate(date: Date): string {
    const key = new Date(date).toDateString();
    const raws = (this.rawTimeEntries || []) as Array<Record<string, unknown>>;
    const lines: string[] = [];

    raws.forEach(r => {
      const start = typeof r['start'] === 'string' ? new Date(r['start'] as string) : undefined;
      if (!start) return;
      if (start.toDateString() !== key) return;
      const minutes = typeof r['minutes'] === 'number' ? (r['minutes'] as number) : Number(r['minutes'] ?? 0);
      const taskId = String(r['taskId'] ?? '');
      const task = (this.tasks || []).find(t => t.id === taskId);
      const title = task ? task.title : (r['description'] ?? 'Entry');
      const startStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const end = typeof r['end'] === 'string' ? new Date(r['end'] as string) : undefined;
      const endStr = end ? end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      lines.push(`${startStr}${endStr ? '–' + endStr : ''} ${minutes}m — ${String(title)}`);
    });

    // derived entries
    this.filteredTimeEntries.forEach(e => {
      if (new Date(e.date).toDateString() !== key) return;
      // skip if already included via raw (match by id)
      const foundRaw = raws.find(r => String(r['id'] ?? '') === e.id || String(r['taskId'] ?? '') === e.id);
      if (foundRaw) return;
      const task = (this.tasks || []).find(t => t.id === e.id);
      const title = task ? task.title : e.description || 'Task entry';
      lines.push(`${this.formatTime(e.timeSpent)} — ${title}`);
    });

    return lines.join('\n') || 'No entries';
  }
}
