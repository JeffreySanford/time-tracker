import { Component, inject, OnDestroy, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Project, ProjectTag } from './models/project.model';
import { Subject, Subscription } from 'rxjs';

// Use shared Project and ProjectTag types from models/project.model.ts

interface Task {
  id: string;
  title: string;
  description: string;
  project: string;
  tags: string[];
  status: 'active' | 'completed' | 'paused';
  timeSpent: number; // in seconds
  startTime?: Date;
  endTime?: Date;
  createdAt: Date;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false
})
export class HomeComponent implements OnDestroy, OnChanges {
  // Inputs from parent
  @Input() projects: Project[] = [];
  @Input() allTasks: Task[] = [];
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

  http = inject(HttpClient);

  constructor() {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    this.todayString = today.toLocaleDateString(undefined, options);

    this.subscriptions.push(
      this.startSubject.subscribe(() => {
        this.timerActive = true;
        this.timerStart = Date.now();
        this.timerDisplay = '00:00:00';
        const sub = this.http.post<{ _id: string; userId: string; startedAt: string; endedAt: string | null; duration: number }>(
          '/api/timeworked/start', { userId: 'demo-user' })
          .subscribe({
            next: (session) => {
              this.timerSessionId = session._id;
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
          const sub = this.http.patch<{ _id: string; userId: string; startedAt: string; endedAt: string | null; duration: number }>(
            `/api/timeworked/stop/${this.timerSessionId}`, { endedAt: new Date() })
            .subscribe({
              next: (result) => {
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

  getTagColor(tagName: string): string {
    // Default color scheme for tags
    const tagColors: { [key: string]: string } = {
      'frontend': '#06b6d4',
      'backend': '#84cc16',
      'angular': '#dd0031',
      'nestjs': '#e0234e',
      'design': '#ec4899',
      'api': '#f59e0b'
    };
    
    const cleanTag = tagName.replace('#', '');
    return tagColors[cleanTag] || (this.selectedProject?.color ?? '#667eea');
  }

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
    const statuses: ('active' | 'completed' | 'paused')[] = ['active', 'paused', 'completed'];
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
