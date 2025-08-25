import { Component, OnDestroy, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TimeWorkedApiService, TimeWorkedSessionDto } from './services/timeworked-api.service';
import { Project, ProjectTag } from './models/project.model';
import { Subject, Subscription } from 'rxjs';

// Use shared Project and ProjectTag types from models/project.model.ts

interface Task {
  id: string;
  title: string;
  description: string;
  project: string;
  tags: string[];
  status: 'active' | 'completed' | 'backlog';
  timeSpent: number; // in seconds
  startTime?: Date;
  endTime?: Date;
  createdAt: Date;
  // _meta stores DB extras like labels and assignees. Explicitly type the commonly used fields.
  _meta?: {
  // migrated shape: `tags` contains label objects {id?, name, color?}
  tags?: Array<{id?: string; name?: string; color?: string}>;
    assignees?: string[];
    [key: string]: unknown;
  };
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: false
})
export class HomeComponent implements OnInit, OnDestroy, OnChanges {
  // Inputs from parent
  @Input() projects: Project[] = [];
  @Input() allTasks: Task[] = [];
  @Input() tagsList: Array<{id: string; name: string; color?: string}> = [];
  // Accept the common runtime shape: array of assignee ids (or undefined/null)
  @Input() resolveAssignees: (assignees?: string[] | null) => string = () => '';
  // Currently selected project (set externally or defaulted on init)
  @Input() selectedProject: Project | undefined;
  @Output() projectChange = new EventEmitter<Project>();
  @Output() taskUpdate = new EventEmitter<Task>();
  @Output() taskDelete = new EventEmitter<string>();

  // When older tasks still have legacy label UIDs, fall back to tagsList resolution.
  getTagName(work: {id?: string; name?: string; color?: string} | string | undefined): string {
    if (!work) return '';
    if (typeof work === 'string') {
      return this.tagsList.find(l => l.id === work)?.name || work;
    }
    return work.name || (work.id ? (this.tagsList.find(l => l.id === work.id)?.name || work.id) : '');
  }

  getTagColor(work: {id?: string; name?: string; color?: string} | string | undefined): string {
    if (!work) return '#ddd';
    if (typeof work === 'string') {
      const explicit = this.tagsList.find(l => l.id === work || l.name === work)?.color;
      if (explicit) return explicit;
      return this.getStandardTagColor(work);
    }
    return work.color || (work.id ? (this.tagsList.find(l => l.id === work.id)?.color || this.getStandardTagColor(work.name || work.id)) : this.getStandardTagColor(work.name || ''));
  }

  // Timer properties
  timerActive = false;
  timerDisplay = '00:00:00';
  timerInterval: ReturnType<typeof setInterval> | null = null;
  timerStart = 0;
  timerSessionId: string | null = null;
  isPaused = false;
  pausedTime = 0;
  todayString = '';

  // Task properties
  currentTaskDescription = '';
  currentProject = 'time-forge';
  currentTags: string[] = [];
  showProjectSelector = false;
  
  // Task management
  tasks: Task[] = []; // Filtered tasks for current project
  displayedColumns: string[] = ['title', 'tags', 'timeSpent', 'status', 'actions'];
  // Status visibility toggles (initially only show active tasks)
  showBacklog = false;
  showCompleted = false;
  // Tag legend + standardized colors
  private tagColorMap: Record<string, string> = {};
  private readonly defaultTagPalette: string[] = ['#3b82f6','#10b981','#f59e0b','#ef4444','#6366f1','#14b8a6','#f472b6','#8b5cf6','#84cc16','#06b6d4'];
  private paletteIndex = 0;
  showTagLegend = false;
  legendTag: string | null = null;

  // Default assignee details for time-forge project
  private readonly defaultAssignee = {
    id: '66c1f0e3a1c9f0b1d0012001',
    short: 'Jeffrey S.',
    full: 'Jeffrey Sanford',
    employeeNo: 'EMP-0001'
  };
  // Track per-task expanded state for assignee display
  assigneeExpanded: Record<string, boolean> = {};

  startSubject = new Subject<void>();
  stopSubject = new Subject<void>();
  subscriptions: Subscription[] = [];

  private http = inject(HttpClient);
  private timeWorked = inject(TimeWorkedApiService);

  constructor() {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    this.todayString = today.toLocaleDateString(undefined, options);
  }

  ngOnInit() {
    // If no selectedProject provided yet, default to first available project
    if (!this.selectedProject && this.projects.length > 0) {
      this.selectedProject = this.projects[0];
      this.currentProject = this.selectedProject.id;
      this.filterTasksForProject(this.currentProject);
    }
    this.subscriptions.push(
      this.startSubject.subscribe(() => {
        this.timerActive = true;
        this.timerStart = Date.now();
        this.timerDisplay = '00:00:00';
        const sub = this.timeWorked.start('demo-user').subscribe({
            next: (session: TimeWorkedSessionDto | void) => {
              this.timerSessionId = (session && (session as TimeWorkedSessionDto)._id) ? (session as TimeWorkedSessionDto)._id : null;
              console.log('Timer session started:', session);
              this.timerInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - this.timerStart) / 1000);
                this.timerDisplay = this.formatTime(elapsed);
              }, 1000);
            },
            error: (err) => {
              console.error('Error starting timer session:', err);
            }
          });
        this.subscriptions.push(sub);
      })
    );

    this.subscriptions.push(
      this.stopSubject.subscribe(() => {
        this.timerActive = false;
        if (this.timerInterval !== null) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
        // Compute elapsed time (milliseconds) for this session
        let elapsedMs = 0;
        if (this.isPaused) {
          elapsedMs = this.pausedTime;
        } else if (this.timerStart) {
          elapsedMs = Date.now() - this.timerStart;
        }

        const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));

        // If there is a current task description, create a task from this session with the elapsed time
        if (this.currentTaskDescription && this.currentTaskDescription.trim()) {
          const startTime = this.timerStart ? new Date(this.timerStart) : undefined;
          const endTime = startTime ? new Date((startTime as Date).getTime() + elapsedMs) : undefined;
          this.createTaskFromCurrentSession(elapsedSeconds, startTime, endTime);
        }

        if (this.timerSessionId) {
          const sub = this.timeWorked.stop(this.timerSessionId, new Date()).subscribe({
              next: (result: TimeWorkedSessionDto | void) => {
                console.log('Timer session stopped:', result);
                this.timerSessionId = null;
              },
              error: (err) => {
                console.error('Error stopping timer session:', err);
              }
            });
          this.subscriptions.push(sub);
        }
      })
    );
  }

  // (initialization moved into the injected constructor)

  ngOnChanges(changes: SimpleChanges) {
    if (changes['allTasks'] && this.allTasks) {
      this.filterTasksForProject(this.currentProject);
    }
    
    if (changes['selectedProject'] && this.selectedProject) {
      this.currentProject = this.selectedProject.id;
      this.filterTasksForProject(this.currentProject);
      this.showTagLegend = false;
      this.legendTag = null;
    }
  }

  startTimer() {
    if (this.isPaused) {
      // Resume from pause
      this.isPaused = false;
      this.timerStart = Date.now() - this.pausedTime;
      this.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.timerStart) / 1000);
        this.timerDisplay = this.formatTime(elapsed);
      }, 1000);
    } else {
      // Start new session
      this.startSubject.next();
    }
  }

  pauseTimer() {
    if (this.timerActive && !this.isPaused) {
      this.isPaused = true;
      this.pausedTime = Date.now() - this.timerStart;
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    }
  }

  stopTimer() {
    this.isPaused = false;
    this.pausedTime = 0;
    this.stopSubject.next();
  }

  toggleProjectSelector() {
    this.showProjectSelector = !this.showProjectSelector;
  }

  // Safe accessor used in template binding
  get currentSelectedProject(): Project {
    return this.selectedProject ?? { id: '', name: '', color: '#ccc', bgColor: '#f8fafc', description: '', suggestedTags: [] } as Project;
  }

  selectProject(project: Project) {
    this.selectedProject = project;
    this.currentProject = project.id;
    this.currentTags = []; // Clear current tags when switching projects
    this.showProjectSelector = false;
    this.filterTasksForProject(project.id);
    this.projectChange.emit(project);
  }

  addTag(tag: ProjectTag) {
    if (!this.currentTags.includes(tag.name)) {
      this.currentTags.push(tag.name);
    }
  }

  removeTag(tag: string): void {
    this.currentTags = this.currentTags.filter(t => t !== tag);
  }

  // NOTE: color resolution for tag objects/strings is handled by getTagColor(work)

  // Task management methods
  filterTasksForProject(projectId: string): void {
  const projectTasks = this.allTasks.filter(task => task.project === projectId);
  // Ensure default assignee for time-forge tasks
  projectTasks.forEach(t => this.ensureDefaultAssignee(t));
    // Apply status visibility filters: always show active; optionally backlog/completed
    this.tasks = projectTasks.filter(task => {
      if (task.status === 'active') return true;
      if (task.status === 'backlog') return this.showBacklog;
      if (task.status === 'completed') return this.showCompleted;
      return true; // fallback
    });
  }

  loadTasksForProject(projectId: string): void {
    // This method is kept for backward compatibility and API calls in the future
    // For now, it just calls the filter method
    this.filterTasksForProject(projectId);
  }

  /**
   * Create a task from the current session. Optionally provide duration (in seconds), start and end times
   */
  createTaskFromCurrentSession(durationSeconds?: number, startTime?: Date, endTime?: Date) {
    if (this.currentTaskDescription.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: this.currentTaskDescription,
        description: '',
        project: this.currentProject,
        tags: [...this.currentTags],
        status: 'active',
        timeSpent: durationSeconds ?? 0,
        startTime: startTime,
        endTime: endTime,
        createdAt: new Date(),
        _meta: {
          assignees: this.currentProject === 'time-forge' ? [this.defaultAssignee.id] : []
        }
      };

      // Emit task update to parent (parent manages the task arrays)
      this.taskUpdate.emit(newTask);
      // Add to current filtered tasks for immediate UI update
      this.tasks.push(newTask);
      // Clear current inputs
      this.currentTaskDescription = '';
      this.currentTags = [];
    }
  }

  private ensureDefaultAssignee(task: Task): void {
    if (task.project !== 'time-forge') return;
    if (!task._meta) task._meta = {};
    if (!Array.isArray(task._meta.assignees)) task._meta.assignees = [];
    if (!task._meta.assignees.includes(this.defaultAssignee.id)) {
      task._meta.assignees.push(this.defaultAssignee.id);
    }
  }

  toggleAssignee(task: Task): void {
    this.assigneeExpanded[task.id] = !this.assigneeExpanded[task.id];
  }

  getAssigneeDisplay(task: Task): string {
    if (task.project !== 'time-forge') {
      return this.resolveAssignees(task._meta?.assignees || null);
    }
    const expanded = !!this.assigneeExpanded[task.id];
    return expanded ? `${this.defaultAssignee.full} (${this.defaultAssignee.employeeNo})` : this.defaultAssignee.short;
  }

  // Always return HH:MM:SS zero-padded for the live timer display and most UI
  formatTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }

  trackProject(index: number, project: Project): string {
    return project.id;
  }

  toggleTaskStatus(task: Task): void {
  const statuses: ('active' | 'completed' | 'backlog')[] = ['active', 'backlog', 'completed'];
    const currentIndex = statuses.indexOf(task.status);
    const nextIndex = (currentIndex + 1) % statuses.length;
    task.status = statuses[nextIndex];
    this.taskUpdate.emit(task);
    // Re-apply filter so task may disappear if toggled to a hidden status
    this.filterTasksForProject(this.currentProject);
  }

  // Toggle visibility of backlog tasks
  toggleShowBacklog(): void {
    this.showBacklog = !this.showBacklog;
    this.filterTasksForProject(this.currentProject);
  }

  // Toggle visibility of completed tasks
  toggleShowCompleted(): void {
    this.showCompleted = !this.showCompleted;
    this.filterTasksForProject(this.currentProject);
  }

  deleteTask(taskId: string): void {
    this.tasks = this.tasks.filter(task => task.id !== taskId);
    this.taskDelete.emit(taskId);
  }

  toggleCodeFlag(): void {
    if (!this.selectedProject?.id) return;
    const next = !(this.selectedProject.isCodeProject !== false);
  this.http.patch(`/api/projects/${this.selectedProject.id}`, { isCodeProject: next }).subscribe({
      next: () => {
        this.selectedProject = { ...this.selectedProject, isCodeProject: next } as Project;
        this.projectChange.emit(this.selectedProject);
      },
      error: (err) => console.error('Failed to update project code flag', err)
    });
  }

  toggleBillableFlag(): void {
    if (!this.selectedProject?.id) return;
    const current = !(this.selectedProject.isBillable === false);
    const next = !current; // invert
  this.http.patch(`/api/projects/${this.selectedProject.id}`, { isBillable: next }).subscribe({
      next: () => {
        this.selectedProject = { ...this.selectedProject, isBillable: next } as Project;
        this.projectChange.emit(this.selectedProject);
      },
      error: (err) => console.error('Failed to update project billable flag', err)
    });
  }
  // Assign or retrieve a deterministic standard color for a tag (single implementation)
  private getStandardTagColor(tag: string): string {
    if (!tag) return '#ddd';
    const key = tag.toLowerCase();
    if (this.tagColorMap[key]) return this.tagColorMap[key];
    const color = this.defaultTagPalette[this.paletteIndex % this.defaultTagPalette.length];
    this.tagColorMap[key] = color;
    this.paletteIndex++;
    return color;
  }

  toggleTagLegend(tag: string): void {
    if (this.legendTag === tag && this.showTagLegend) {
      this.showTagLegend = false;
      this.legendTag = null;
    } else {
      this.legendTag = tag;
      this.showTagLegend = true;
    }
  }

  get tasksForLegend(): Task[] {
    if (!this.legendTag) return [];
    return this.tasks.filter(t => t.tags.includes(this.legendTag!));
  }

  get activeTaskCount(): number {
    return this.tasks.reduce((acc, t) => acc + (t.status === 'active' ? 1 : 0), 0);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
