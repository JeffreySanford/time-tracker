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
      return this.tagsList.find(l => l.id === work)?.color || '#ddd';
    }
    return work.color || (work.id ? (this.tagsList.find(l => l.id === work.id)?.color || '#ddd') : '#ddd');
  }

  // Normalize task tag data for templates: prefer migrated `_meta.tags` (objects), fall back to legacy label id array
  getTaskTags(task: Task): Array<{id?: string; name?: string; color?: string} | string> {
    const meta = task._meta as Record<string, unknown> | undefined;
    if (!meta) return [];
    const maybeTags = meta['tags'] as unknown;
    if (Array.isArray(maybeTags)) return maybeTags as Array<{id?: string; name?: string; color?: string} | string>;
    const legacy = meta['labels'] as unknown; // legacy field name in some seeded JSON
    if (Array.isArray(legacy)) return legacy as string[];
    return [];
  }
  @Input() selectedProject: Project = {
    id: '',
    name: '',
    color: '',
    bgColor: '',
    description: '',
    suggestedTags: []
  };
  
  // Outputs to parent
  @Output() projectChange = new EventEmitter<Project>();
  @Output() taskUpdate = new EventEmitter<Task>();
  @Output() taskDelete = new EventEmitter<string>();

  todayString: string;

  // Timer properties
  timerActive = false;
  timerDisplay = '00:00:00';
  timerInterval: ReturnType<typeof setInterval> | null = null;
  timerStart = 0;
  timerSessionId: string | null = null;
  isPaused = false;
  pausedTime = 0;

  // Task properties
  currentTaskDescription = '';
  currentProject = 'time-forge';
  currentTags: string[] = [];
  showProjectSelector = false;
  
  // Task management
  tasks: Task[] = []; // Filtered tasks for current project
  displayedColumns: string[] = ['title', 'tags', 'timeSpent', 'status', 'actions'];

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
    this.tasks = this.allTasks.filter(task => task.project === projectId);
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
        createdAt: new Date()
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
  }

  deleteTask(taskId: string): void {
    this.tasks = this.tasks.filter(task => task.id !== taskId);
    this.taskDelete.emit(taskId);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
