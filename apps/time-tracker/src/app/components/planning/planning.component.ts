import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChildren,
  QueryList,
  AfterViewInit,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { KanbanColumnsService } from '../../services/kanban-columns.service';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { Project } from '../../models/project.model';
import * as TimerActions from '../../store/timer.actions';
import { TimerState } from '../../store/timer.reducer';
import { StatusSummaryItem } from '@time-tracker/shared-ui';

interface Task {
  id: string;
  title: string;
  description: string;
  userId?: string;
  project: string;
  tags: string[];
  status: 'active' | 'completed' | 'backlog';
  timeSpent: number;
  startTime?: Date;
  endTime?: Date;
  createdAt: Date;
  priority?: 'low' | 'medium' | 'high';
  estimatedTime?: number; // in seconds
}
interface Column {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
}

@Component({
  selector: 'app-planning',
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.scss'],
  standalone: false,
})
export class PlanningComponent implements AfterViewInit, OnInit, OnChanges {
  @Input() projects: Project[] = [];
  @Input() allTasks: Task[] = [];
  @Input() selectedProject!: Project; // Will always be provided by parent
  @Output() projectChange = new EventEmitter<Project>();
  @Output() taskUpdate = new EventEmitter<Task>();
  @Output() taskDelete = new EventEmitter<string>();

  viewMode: 'kanban' | 'list' = 'kanban';
  showProjectSelector = false;
  showTaskForm = false;
  // Controls whether additional/extended status columns are shown
  showExtendedColumns = false;

  // New task form
  newTask: Partial<Task> = {
    title: '',
    description: '',
    tags: [],
    priority: 'medium',
    estimatedTime: 3600, // 1 hour default
  };

  get filteredTasks(): Task[] {
    return this.allTasks.filter(
      (task) => task.project === this.selectedProject.id
    );
  }

  // Stable kanban columns array used by the template. Must be kept stable
  // (same references) to avoid breaking CDK drag/drop when change detection
  // recreates arrays.
  private _kanbanColumns: Column[] = [];

  get kanbanColumns(): Column[] {
    return this._kanbanColumns;
  }

  // Expose banner statuses array for use in template and StatusSummaryComponent
  bannerStatuses: StatusSummaryItem[] = [];

  ngOnInit(): void {
    // Trigger health check when kanban/planning page loads to update connection status
    this.store.dispatch(TimerActions.pingServer());

    // Load kanban columns from API to ensure we have fresh data
    this.kanbanService.refresh().subscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Rebuild columns whenever relevant inputs change
    if (
      changes['allTasks'] ||
      changes['selectedProject'] ||
      changes['showExtendedColumns']
    ) {
      this.buildKanbanColumns();
      this.computeBannerStatuses();
    }
  }

  private buildKanbanColumns() {
    const baseOrder = ['backlog', 'active', 'completed'];

    const extraStatuses = Array.from(
      new Set(this.filteredTasks.map((t) => t.status))
    ).filter((s) => !baseOrder.includes(s));

    const order = [...baseOrder];
    if (this.showExtendedColumns && extraStatuses.length) {
      const insertAt = order.indexOf('active') + 1;
      order.splice(insertAt, 0, ...extraStatuses);
    }

    const titleFor = (s: string) => {
      if (s === 'backlog') return 'Backlog';
      if (s === 'active') return 'Active';
      if (s === 'completed') return 'Completed';
      return s
        .split(/-|_/)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');
    };

    const colorFor = (s: string) => {
      if (s === 'backlog') return '#f59e0b';
      if (s === 'active') return '#3b82f6';
      if (s === 'completed') return '#10b981';
      return '#6b7280';
    };

    // Build stable arrays for each column's tasks
    this._kanbanColumns = order.map((id) => ({
      id,
      title: titleFor(id),
      tasks: this.filteredTasks.filter((task) => task.status === id),
      color: colorFor(id),
    }));
  }

  private computeBannerStatuses() {
    const statuses = this.getBannerStatuses();
    this.bannerStatuses = statuses.map((s) => ({
      id: s.id,
      label: s.label,
      color: s.color,
      count: s.count,
      cssClass: this.getStatusCssClass(s.id),
    }));
  }

  // Collect cdk drop list directive instances so we can pass their actual
  // runtime ids to the connected lists binding. This ensures the CDK wiring
  // points to directive ids (not just DOM ids) which avoids fragile/template
  // parsing issues and makes cross-list dragging reliable.
  @ViewChildren(CdkDropList) dropLists!: QueryList<CdkDropList<Task[]>>;

  connectedDropListIds: string[] = [];

  ngAfterViewInit(): void {
    const build = () => {
      this.connectedDropListIds = this.dropLists
        .toArray()
        .map((dl) => dl.id)
        .filter(Boolean);
    };

    build();
    this.dropLists.changes.subscribe(build);
    // Debug: print connected drop lists so dev can confirm CDK wiring
    console.log(
      'PlanningComponent ngAfterViewInit connectedDropLists:',
      this.connectedDropLists.map((d) => d.id)
    );
  }

  private kanbanService = inject(KanbanColumnsService);
  private store = inject(Store<{ timer: TimerState }>);

  get dropListIds(): string[] {
    return this.connectedDropListIds;
  }

  // Also expose the actual CdkDropList directive instances as an array.
  // Binding the connected lists to directive instances is more resilient
  // than using DOM ids and avoids mismatches between host id attributes
  // and the directive's internal id generation.
  get connectedDropLists(): CdkDropList<Task[]>[] {
    return this.dropLists ? this.dropLists.toArray() : [];
  }

  // Helper used by templates to get task counts safely by status id
  getColumnCount(status: string): number {
    const col = this.kanbanColumns.find((c) => c.id === status);
    return col ? col.tasks.length : 0;
  }

  toggleView() {
    this.viewMode = this.viewMode === 'kanban' ? 'list' : 'kanban';
  }

  toggleProjectSelector() {
    this.showProjectSelector = !this.showProjectSelector;
  }

  selectProject(project: Project) {
    this.selectedProject = project;
    this.showProjectSelector = false;
    this.projectChange.emit(project);
  }

  toggleTaskForm() {
    this.showTaskForm = !this.showTaskForm;
    if (!this.showTaskForm) {
      this.resetTaskForm();
    }
  }

  resetTaskForm() {
    this.newTask = {
      title: '',
      description: '',
      tags: [],
      priority: 'medium',
      estimatedTime: 3600,
    };
  }

  createTask() {
    if (!this.newTask.title?.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      title: this.newTask.title,
      description: this.newTask.description || '',
      userId: '',
      project: this.selectedProject.id,
      tags: this.newTask.tags || [],
      status: 'active',
      timeSpent: 0,
      createdAt: new Date(),
      priority: this.newTask.priority || 'medium',
      estimatedTime: this.newTask.estimatedTime || 3600,
    };

    this.taskUpdate.emit(task);
    this.resetTaskForm();
    this.showTaskForm = false;
  }

  updateTaskStatus(task: Task, newStatus: 'active' | 'completed' | 'backlog') {
    const updatedTask = { ...task, status: newStatus };
    this.taskUpdate.emit(updatedTask);
  }

  // New CDK drop handler used by the template. It will move items within
  // a column or between columns and emit an updated task with the new status.
  onCdkDrop(event: CdkDragDrop<Task[]>, targetStatus: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      return;
    }

    // Transfer item between lists
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    const moved = event.container.data[event.currentIndex];
    if (!moved) return;

    const newStatus = targetStatus as 'active' | 'completed' | 'backlog';
    if (moved.status !== newStatus) {
      const updated = { ...moved, status: newStatus };
      // Emit updated task so parent can persist changes
      this.taskUpdate.emit(updated);
      // Persist new order of columns to server (best-effort)
      try {
        const orderIds = this.kanbanColumns.map((c) => c.id);
        this.kanbanService.updateOrder(orderIds).subscribe({
          error: (err) => console.error('Failed to persist kanban order', err),
        });
      } catch (e) {
        console.error('Error while persisting kanban order', e);
      }
    }
  }

  deleteTask(taskId: string) {
    this.taskDelete.emit(taskId);
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

  // total time across currently filtered tasks (seconds)
  get totalTimeForFilteredTasks(): number {
    return this.filteredTasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0);
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  }

  getProjectColor(projectId: string): string {
    const project = this.projects.find((p) => p.id === projectId);
    return project ? project.color ?? '#667eea' : '#667eea';
  }

  addTag(tagName: string) {
    if (tagName.trim() && !this.newTask.tags?.includes(tagName.trim())) {
      this.newTask.tags = [...(this.newTask.tags || []), tagName.trim()];
    }
  }

  removeTag(tagName: string) {
    this.newTask.tags =
      this.newTask.tags?.filter((tag) => tag !== tagName) || [];
  }

  // Get total count of all tasks across all projects (for the banner)
  getTotalTasks(): number {
    return this.getRelevantTasks().length;
  }

  // Get count of tasks in a specific column/status across all projects (for the banner)
  getTotalColumnCount(status: string): number {
    return this.getRelevantTasks().filter((task) => task.status === status)
      .length;
  }

  // Get all unique statuses that exist across all tasks
  getAllStatuses(): string[] {
    return Array.from(
      new Set(this.getRelevantTasks().map((task) => task.status))
    );
  }

  // Helper: tasks to consider for banner/status summary. If a project is selected
  // we scope to that project's tasks; otherwise use all tasks.
  private getRelevantTasks(): Task[] {
    if (this.selectedProject?.id) {
      return this.allTasks.filter((t) => t.project === this.selectedProject.id);
    }
    return this.allTasks;
  }

  // Get statuses to display in the banner based on showExtendedColumns setting
  getBannerStatuses(): Array<{
    id: string;
    label: string;
    color: string;
    count: number;
  }> {
    const baseStatuses = ['backlog', 'active', 'completed'];
    const allStatuses = this.getAllStatuses();

    // Always show base statuses, add extended ones if enabled and they have tasks
    let statusesToShow = [...baseStatuses];

    if (this.showExtendedColumns) {
      const extraStatuses = allStatuses.filter(
        (s) => !baseStatuses.includes(s) && this.getTotalColumnCount(s) > 0
      );
      statusesToShow.push(...extraStatuses);
    }

    return statusesToShow.map((status) => ({
      id: status,
      label: this.getStatusLabel(status),
      color: this.getStatusColor(status),
      count: this.getTotalColumnCount(status),
    }));
  }

  // Convert status ID to human-readable label
  getStatusLabel(status: string): string {
    switch (status) {
      case 'backlog':
        return 'Backlog';
      case 'active':
        return 'Active';
      case 'completed':
        return 'Done';
      default:
        // Convert kebab-case or snake_case to Title Case
        return status
          .split(/-|_/)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
    }
  }

  // Get color for status
  getStatusColor(status: string): string {
    switch (status) {
      case 'backlog':
        return '#f59e0b';
      case 'active':
        return '#3b82f6';
      case 'completed':
        return '#10b981';
      case 'in-review':
        return '#8b5cf6';
      case 'testing':
        return '#f97316';
      case 'blocked':
        return '#ef4444';
      case 'on-hold':
        return '#6b7280';
      default:
        return '#64748b'; // Default gray for unknown statuses
    }
  }

  // Get CSS class for status styling
  getStatusCssClass(status: string): string {
    switch (status) {
      case 'backlog':
        return 'backlog';
      case 'active':
        return 'active';
      case 'completed':
        return 'done';
      default:
        return 'extended';
    }
  }
}
