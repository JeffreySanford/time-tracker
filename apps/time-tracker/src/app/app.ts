import { Component, HostListener, OnInit, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Capacitor } from '@capacitor/core';
import { Store } from '@ngrx/store';
import { Observable, of, timer } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import {
  catchError,
  delayWhen,
  mapTo,
  retryWhen,
  scan,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';

import projectsData from '../assets/projects.json';
import tagsData from '../assets/tags.json';
import tasksData from '../assets/tasks.json';
import usersData from '../assets/users.json';
import { Project } from './models/project.model';
import { TaskApiService } from './services/task-api.service';
import * as TimerActions from './store/timer.actions';
import { TimerState } from './store/timer.reducer';

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
  priority?: 'low' | 'medium' | 'high';
  estimatedTime?: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  standalone: false,
})
export class App implements OnInit {
  title = 'Time Forge';
  private api = inject(TaskApiService);
  private snackBar = inject(MatSnackBar);
  private store = inject(Store<{ timer: TimerState }>);

  // Navigation state
  currentView: 'reports' | 'home' | 'planning' = 'home';

  // Touch/swipe handling
  private startX = 0;
  private startY = 0;
  private currentX = 0;
  private currentY = 0;
  private isDragging = false;
  private minSwipeDistance = 50;

  // Mouse hover for desktop navigation arrows
  showLeftArrow = false;
  showRightArrow = false;

  // Header properties
  selectedRange = '1';
  currentDateDisplay = '';
  totalTimeDisplay = '8h 42m';
  unreadMessages = 3;
  showUserMenu = false;

  // Footer properties - now from store
  isConnected$ = this.store.select((state) => state.timer.isConnected);
  pingTime$ = this.store.select((state) => state.timer.pingTime);

  // Sync values for template (temporary until we make template async)
  isConnected = true;
  pingTime: number | null = null;

  // Shared data between components
  // Load projects from the static JSON file so it can be easily edited/extended
  projects: Project[] = (projectsData as Project[]).concat([
    // keep a small portfolio entry locally for demo/sample tasks
    {
      id: 'portfolio',
      name: '🎨 Portfolio',
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
      description: 'Personal portfolio website',
      suggestedTags: [
        { name: 'design', color: '#ec4899' },
        { name: 'frontend', color: '#06b6d4' },
        { name: 'responsive', color: '#f59e0b' },
      ],
    },
  ]);

  allTasks: Task[] = [];
  users: Array<{ id: string; name: string }> = (
    usersData as unknown as Array<Record<string, unknown>>
  ).map((u) => ({
    id: String(u['id'] ?? u['_id'] ?? ''),
    name: String(u['name'] ?? ''),
  }));
  tagsList: Array<{ id: string; name: string; color?: string }> = (
    tagsData as unknown as Array<Record<string, unknown>>
  ).map((l) => ({
    id: String(l['id'] ?? l['_id'] ?? ''),
    name: String(l['name'] ?? ''),
    color: String(l['color'] ?? ''),
  }));
  selectedProject!: Project; // Will always be defined after ngOnInit

  ngOnInit() {
    // Ensure compatibility aliases for older IDs used by sample tasks
    const ensureProject = (id: string, fallback: Partial<Project>) => {
      if (!this.projects.find((p) => p.id === id)) {
        this.projects.push({
          id: id,
          name: fallback.name || id,
          color: fallback.color || '#999',
          bgColor: fallback.bgColor || 'rgba(0,0,0,0.04)',
          description: fallback.description || '',
          ...(fallback as Partial<Project>),
        } as Project);
      }
    };

    ensureProject('forge-board', {
      name: '📋 Forge Board',
      description: 'Forge Board (compat alias)',
    });
    ensureProject('buffalo-city-popcorn', {
      name: '🍿 Buffalo City Popcorn',
      description: 'Buffalo City Popcorn (compat alias)',
    });

    // Initialize with Time Forge project
    this.selectedProject =
      this.projects.find((p) => p.id === 'time-forge') || this.projects[0];
    // Wait for backend readiness (Mongo seeded) before first refresh to avoid empty flash
    this.waitForBackendReady()
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.api
            .refresh(this.selectedProject?.id)
            .pipe(take(1))
            .subscribe({
              complete: () => this.restoreSessionTasks(),
              error: () => this.restoreSessionTasks(),
            });
        },
        error: () => {
          // On persistent failure just attempt refresh and fall back
          this.api
            .refresh(this.selectedProject?.id)
            .pipe(take(1))
            .subscribe({
              complete: () => this.restoreSessionTasks(),
              error: () => this.restoreSessionTasks(),
            });
        },
      });

    // Keep `allTasks` in sync with TaskApiService's hot cache
    this.api.tasks$.subscribe(
      (list: import('./services/task-api.service').TaskDto[] | null) => {
        if (Array.isArray(list)) {
          // If API returned tasks, map them. If it returned an empty array, fall back to local sample JSON
          if (list.length > 0) {
            this.allTasks = (list as Array<Record<string, unknown>>).map((t) =>
              this.mapRawToTask(t),
            );
          } else if (!this.allTasks || this.allTasks.length === 0) {
            // Fallback only if we don't already have tasks (avoid overwriting user-created tasks later)
            this.loadTasksFromJson();
          }
        }
      },
    );

    // Initialize current date display
    const today = new Date();
    this.currentDateDisplay = today.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Subscribe to connection status from store
    this.isConnected$.subscribe((isConnected) => {
      this.isConnected = isConnected;
    });

    this.pingTime$.subscribe((pingTime) => {
      this.pingTime = pingTime;
    });

    // Test initial connection using store action
    this.store.dispatch(TimerActions.pingServer());

    // Set up periodic health checks every 30 seconds
    timer(30000, 30000).subscribe(() => {
      this.store.dispatch(TimerActions.pingServer());
    });

    // Toggle Android platform class so we can apply small OS-specific CSS fixes
    try {
      const isAndroid =
        Capacitor.getPlatform && Capacitor.getPlatform() === 'android';
      document.body.classList.toggle('platform-android', !!isAndroid);
    } catch {
      // Capacitor may not be available in browser/dev server - ignore
    }
  }

  // snackBar provided via constructor injection

  private loadTasksFromJson(): void {
    // Convert imported JSON (with ISO strings) to Task objects with Date types
    try {
      const rawTasks = tasksData as unknown as Array<Record<string, unknown>>;
      this.allTasks = rawTasks.map((t) => this.mapRawToTask(t));
    } catch (e) {
      console.error('Failed to load tasks from JSON', e);
      this.allTasks = [];
    }
  }

  // Poll /api/ready until backend indicates seeding complete (max ~10s)
  private waitForBackendReady(): Observable<boolean> {
    const attempt = () =>
      fromFetch('/api/ready').pipe(
        switchMap((res) => {
          if (!res.ok) throw new Error('not ok');
          return res.json();
        }),
        mapTo(true),
        catchError(() => of(false)),
      );
    return attempt().pipe(
      switchMap((ok) =>
        ok
          ? of(true)
          : of(false).pipe(
              switchMap(() =>
                attempt().pipe(
                  retryWhen((errs) =>
                    errs.pipe(
                      scan((acc) => acc + 1, 0),
                      delayWhen((i) => timer(300 + i * 300)),
                      take(10),
                    ),
                  ),
                ),
              ),
            ),
      ),
    );
  }

  private tryLoadTasks(): Observable<void> {
    // use constructor-injected TaskApiService
    // Subscribe to the hot tasks stream; if it's empty, trigger a refresh which will update the stream
    return this.api.fetchTasks(this.selectedProject?.id).pipe(
      take(1),
      catchError(() => {
        this.loadTasksFromJson();
        return of(undefined);
      }),
      tap((tasks) => {
        if (Array.isArray(tasks)) {
          this.allTasks = (tasks as Array<Record<string, unknown>>).map((t) =>
            this.mapRawToTask(t),
          );
        } else {
          // If the hot stream has no value yet, trigger a refresh and subscribe once
          this.api
            .refresh(this.selectedProject?.id)
            .pipe(take(1))
            .subscribe({
              next: (resp: unknown) => {
                if (Array.isArray(resp))
                  this.allTasks = (resp as Array<Record<string, unknown>>).map(
                    (t) => this.mapRawToTask(t),
                  );
              },
              error: () => this.loadTasksFromJson(),
            });
        }
      }),
      mapTo(undefined),
    );
  }

  private mapRawToTask(
    t: Record<string, unknown>,
  ): Task & { _meta?: Record<string, unknown> } {
    const createdAt =
      typeof t['createdAt'] === 'string'
        ? new Date(t['createdAt'] as string)
        : new Date();
    const startTime =
      typeof t['startTime'] === 'string'
        ? new Date(t['startTime'] as string)
        : undefined;
    const endTime =
      typeof t['endTime'] === 'string'
        ? new Date(t['endTime'] as string)
        : undefined;

    const statusStr =
      typeof t['status'] === 'string' ? (t['status'] as string) : 'active';

    // Map kanban column IDs (from seeded JSON) to app statuses
    const columnId =
      typeof t['columnId'] === 'string' ? (t['columnId'] as string) : undefined;
    const columnStatusMap: Record<string, Task['status']> = {
      // Backlog -> backlog, In Progress -> active, Review -> backlog, Done -> completed
      '66c1f15ea1c9f0b1d0014001': 'backlog',
      '66c1f15ea1c9f0b1d0014002': 'active',
      '66c1f15ea1c9f0b1d0014003': 'backlog',
      '66c1f15ea1c9f0b1d0014004': 'completed',
    };

    let status = 'active' as Task['status'];
    if (columnId && columnStatusMap[columnId]) {
      status = columnStatusMap[columnId];
    } else if (statusStr === 'done') {
      status = 'completed';
    } else if (statusStr === 'in-progress') {
      status = 'active';
    } else if (statusStr === 'backlog') {
      status = 'backlog';
    } else if (['active', 'completed', 'backlog'].includes(statusStr)) {
      status = statusStr as Task['status'];
    }

    const priorityStr =
      typeof t['priority'] === 'string' ? (t['priority'] as string) : undefined;
    const priority =
      priorityStr === 'low' ||
      priorityStr === 'medium' ||
      priorityStr === 'high'
        ? (priorityStr as Task['priority'])
        : undefined;

    // Build `tags` array from any incoming legacy label UIDs by resolving against the local tagsList.
    const rawLabels = t['labels'];
    let tags: Array<{ id?: string; name?: string; color?: string }> | undefined;
    if (Array.isArray(rawLabels)) {
      tags = (rawLabels as unknown as string[]).map((id) => {
        const found = this.tagsList.find((l) => l.id === String(id));
        return found
          ? { id: found.id, name: found.name, color: found.color }
          : { name: String(id) };
      });
    }

    return {
      id: String(t['id'] ?? t['_id'] ?? ''),
      title: String(t['title'] ?? t['key'] ?? ''),
      description: String(t['description'] ?? ''),
      project: String(
        t['project'] ??
          (t['projectId'] === '66c1f0a0a1c9f0b1d0011001'
            ? 'time-forge'
            : t['projectId']) ??
          '',
      ),
      tags: Array.isArray(t['tags']) ? (t['tags'] as unknown as string[]) : [],
      timeSpent:
        typeof t['timeSpent'] === 'number'
          ? (t['timeSpent'] as number)
          : Number(t['timeSpent'] as unknown) || 0,
      status,
      createdAt,
      startTime,
      endTime,
      priority,
      estimatedTime:
        typeof t['estimatedTime'] === 'number'
          ? (t['estimatedTime'] as number)
          : Number(t['estimatedTime'] as unknown) || undefined,
      _meta: {
        key: t['key'],
        points: t['points'],
        // expose resolved label objects under `tags` (name/color) instead of raw UID strings
        tags,
        assignees: t['assignees'],
        columnId: t['columnId'],
        updatedAt: t['updatedAt'],
      },
    } as Task & { _meta?: Record<string, unknown> };
  }

  // Resolve assignee display for templates. Mobile shows one; web shows a comma-separated list.
  resolveAssigneesDisplay(assignees: unknown): string {
    if (!Array.isArray(assignees)) return '';
    const ids = assignees.map((a) => String(a));
    const names = ids.map(
      (id) => this.users.find((u) => u.id === id)?.name || id,
    );
    let isMobile = window.innerWidth < 600;
    try {
      const platform =
        Capacitor && typeof Capacitor.getPlatform === 'function'
          ? Capacitor.getPlatform()
          : undefined;
      if (platform === 'android' || platform === 'ios') isMobile = true;
    } catch {
      // ignore
    }
    if (isMobile) {
      return names.length ? names[0] : '';
    }
    return names.join(', ');
  }

  // Navigation methods
  navigateToReports() {
    this.currentView = 'reports';
    // Clear hover arrows when leaving home so they don't linger
    this.showLeftArrow = false;
    this.showRightArrow = false;
  }

  navigateToHome() {
    this.currentView = 'home';
    // Reset; hover logic will decide whether to show
    this.showLeftArrow = false;
    this.showRightArrow = false;
  }

  navigateToPlanning() {
    this.currentView = 'planning';
    this.showLeftArrow = false;
    this.showRightArrow = false;
  }

  // Handle view changes from system status component
  onViewChange(view: 'reports' | 'home' | 'planning') {
    switch (view) {
      case 'reports':
        this.navigateToReports();
        break;
      case 'home':
        this.navigateToHome();
        break;
      case 'planning':
        this.navigateToPlanning();
        break;
    }
  }

  // Global keyboard shortcuts
  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.currentView !== 'home') {
      this.currentView = 'home';
    }
  }

  // Touch event handlers
  onTouchStart(event: TouchEvent) {
    this.startX = event.touches[0].clientX;
    this.startY = event.touches[0].clientY;
    this.currentX = this.startX;
    this.currentY = this.startY;
    this.isDragging = true;
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isDragging) return;

    this.currentX = event.touches[0].clientX;
    this.currentY = event.touches[0].clientY;
  }

  onTouchEnd() {
    if (!this.isDragging) return;

    const deltaX = this.currentX - this.startX;
    const deltaY = this.currentY - this.startY;

    // Check if horizontal swipe is dominant
    if (
      Math.abs(deltaX) > Math.abs(deltaY) &&
      Math.abs(deltaX) > this.minSwipeDistance
    ) {
      if (deltaX > 0) {
        // Swipe right
        this.handleSwipeRight();
      } else {
        // Swipe left
        this.handleSwipeLeft();
      }
    }

    this.isDragging = false;
  }

  private handleSwipeLeft() {
    if (this.currentView === 'home') {
      this.navigateToReports();
    } else if (this.currentView === 'planning') {
      this.navigateToHome();
    }
  }

  private handleSwipeRight() {
    if (this.currentView === 'home') {
      this.navigateToPlanning();
    } else if (this.currentView === 'reports') {
      this.navigateToHome();
    }
  }

  // Public methods for template access
  handleLeftClick() {
    // If on planning, left arrow returns to home. Otherwise delegate to swipe-right (home->planning or reports->home)
    if (this.currentView === 'planning') {
      this.navigateToHome();
    } else {
      this.handleSwipeRight();
    }
  }

  handleRightClick() {
    // If on reports, right arrow returns to home. Otherwise delegate to swipe-left (home->reports or planning->home)
    if (this.currentView === 'reports') {
      this.navigateToHome();
    } else {
      this.handleSwipeLeft();
    }
  }

  // Mouse events for desktop navigation arrows
  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (window.innerWidth > 768) {
      // Only on desktop
      const windowWidth = window.innerWidth;
      const edgeThreshold = 100; // px from edge

      // Only show hover arrows while on the center (home) view so side panels have a single inward arrow
      if (this.currentView === 'home') {
        this.showLeftArrow = event.clientX < edgeThreshold;
        this.showRightArrow = event.clientX > windowWidth - edgeThreshold;
      } else {
        this.showLeftArrow = false;
        this.showRightArrow = false;
      }
    }
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.showLeftArrow = false;
    this.showRightArrow = false;
  }

  // Event handlers from child components
  onProjectChange(project: Project) {
    this.selectedProject = project;
    this.refreshSelectedProject();
  }

  private refreshSelectedProject() {
    const projectId = this.selectedProject?.id;
    if (!projectId) return;
    this.api
      .refresh(projectId)
      .pipe(take(1))
      .subscribe({
        next: (tasks) => {
          const list = Array.isArray(tasks) ? tasks : [];
          const hasProjectTasks = list.some((t) => t.project === projectId);
          if (!hasProjectTasks) {
            // Attempt ingestion from static JSON for this project only
            try {
              const rawTasks = tasksData as unknown as Array<
                Record<string, unknown>
              >;
              const projectStatic = rawTasks.filter(
                (t) => String(t['project']) === projectId,
              );
              // Map to minimal DTOs and POST sequentially (avoid race on backend without bulk endpoint)
              if (projectStatic.length) {
                projectStatic.forEach((t) => {
                  const dto: {
                    title: string;
                    description: string;
                    project: string;
                    status: string;
                    timeSpent: number;
                    createdAt: string | Date;
                    estimatedTime?: number;
                    priority?: string;
                  } = {
                    title: String(t['title'] || ''),
                    description: String(t['description'] || ''),
                    project: projectId,
                    status: ['active', 'completed', 'backlog'].includes(
                      String(t['status']),
                    )
                      ? String(t['status'])
                      : 'active',
                    timeSpent:
                      typeof t['timeSpent'] === 'number' ? t['timeSpent'] : 0,
                    createdAt:
                      typeof t['createdAt'] === 'string'
                        ? t['createdAt']
                        : new Date().toISOString(),
                    estimatedTime:
                      typeof t['estimatedTime'] === 'number'
                        ? t['estimatedTime']
                        : undefined,
                    priority:
                      typeof t['priority'] === 'string'
                        ? t['priority']
                        : undefined,
                  };
                  this.api.persistTask(dto).subscribe();
                });
              }
            } catch (e) {
              console.warn('Portfolio ingestion fallback failed', e);
            }
          }
        },
        error: () => {
          // If refresh fails, fallback to static load for all tasks and let filtering handle display
          this.loadTasksFromJson();
        },
      });
  }

  onTaskUpdate(task: Task) {
    const existingIndex = this.allTasks.findIndex((t) => t.id === task.id);
    if (existingIndex >= 0) {
      this.allTasks[existingIndex] = task;
    } else {
      this.allTasks.push(task);
    }
    // Try to persist the change to the API; fall back to sessionStorage so changes
    // survive a reload during the current browser session even if the API is unavailable.
    // Use TaskApiService to persist and rely on its cache update; fall back to session storage on error
    this.api
      .persistTask(task)
      .subscribe({ error: () => this.persistTasksToSession() });
  }

  onTaskDelete(taskId: string) {
    this.allTasks = this.allTasks.filter((task) => task.id !== taskId);
    // Try delete on API; if it fails, persist local state to sessionStorage so the UI
    // remains consistent for the current browser session.
    this.api
      .deleteTask(taskId)
      .subscribe({ error: () => this.persistTasksToSession() });
  }

  // --- Session / API persistence helpers ---
  private persistTasksToSession() {
    try {
      sessionStorage.setItem('tt_tasks', JSON.stringify(this.allTasks || []));
    } catch {
      // ignore session storage errors
    }
  }

  private restoreSessionTasks() {
    try {
      const raw = sessionStorage.getItem('tt_tasks');
      if (!raw) return;
      const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
      if (!Array.isArray(parsed) || parsed.length === 0) return;
      // Map stored objects back through mapRawToTask so Date strings are normalized
      this.allTasks = parsed.map((t) => this.mapRawToTask(t));
    } catch {
      // ignore parse errors
    }
  }

  // NOTE: task persistence is now handled by `TaskApiService` which keeps a hot cache and updates it on save/delete.

  // Header methods
  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  onRangeChange() {
    console.log('Range changed to:', this.selectedRange);

    const days = parseInt(this.selectedRange);
    const today = new Date();

    if (days === 1) {
      this.currentDateDisplay = today.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } else {
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - days + 1);

      this.currentDateDisplay = `${startDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })} - ${today.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })}`;
    }
  }

  // Footer methods
  pingServer() {
    this.store.dispatch(TimerActions.pingServer());
  }
}
