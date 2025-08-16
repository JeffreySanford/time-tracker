import { Component, HostListener, OnInit } from '@angular/core';
import { Capacitor } from '@capacitor/core';

import { Project } from './models/project.model';

interface Task {
  id: string;
  title: string;
  description: string;
  project: string;
  tags: string[];
  status: 'active' | 'completed' | 'paused';
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
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false
})
export class App implements OnInit {
  title = 'Time Forge';
  
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
  
  // Footer properties
  isConnected = true;
  pingTime: number | null = null;
  
  // Shared data between components
  projects: Project[] = [
    {
      id: 'portfolio',
      name: '🎨 Portfolio',
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
      description: 'Personal portfolio website',
      suggestedTags: [
        { name: 'design', color: '#ec4899' },
        { name: 'frontend', color: '#06b6d4' },
        { name: 'responsive', color: '#f59e0b' }
      ]
    },
    {
      id: 'true-north-insights',
      name: '🧭 True North Insights',
      color: '#059669',
      bgColor: 'rgba(5, 150, 105, 0.1)',
      description: 'Analytics and insights platform',
      suggestedTags: [
        { name: 'analytics', color: '#10b981' },
        { name: 'dashboard', color: '#3b82f6' },
        { name: 'data', color: '#6366f1' }
      ]
    },
    {
      id: 'forge-board',
      name: '📋 Forge Board',
      color: '#dc2626',
      bgColor: 'rgba(220, 38, 38, 0.1)',
      description: 'Comprehensive project management with real-time analytics, kanban workflows, audit trails, and enterprise security controls',
      suggestedTags: [
        { name: 'collaboration', color: '#f59e0b' },
        { name: 'ui', color: '#ec4899' },
        { name: 'features', color: '#8b5cf6' }
      ]
    },
    {
      id: 'time-forge',
      name: '⚡ Time Forge',
      color: '#667eea',
      bgColor: 'rgba(102, 126, 234, 0.1)',
      description: 'Advanced time tracking application',
      suggestedTags: [
        { name: 'auth', color: '#ef4444' },
        { name: 'backend', color: '#84cc16' },
        { name: 'architecture', color: '#6366f1' }
      ]
    }
  ];

  allTasks: Task[] = [];
  selectedProject!: Project; // Will always be defined after ngOnInit

  ngOnInit() {
    // Initialize with Time Forge project
    this.selectedProject = this.projects.find(p => p.id === 'time-forge') || this.projects[3];
    this.initializeSampleTasks();
    
    // Initialize current date display
    const today = new Date();
    this.currentDateDisplay = today.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Test initial connection
    this.pingServer();

    // Toggle Android platform class so we can apply small OS-specific CSS fixes
    try {
      const isAndroid = Capacitor.getPlatform && Capacitor.getPlatform() === 'android';
      document.body.classList.toggle('platform-android', !!isAndroid);
    } catch {
      // Capacitor may not be available in browser/dev server - ignore
    }
  }

  private initializeSampleTasks(): void {
    this.allTasks = [
      // Portfolio tasks
      {
        id: '1',
        title: 'Design portfolio landing page',
        description: 'Create an engaging hero section and layout',
        project: 'portfolio',
        tags: ['design', 'frontend'],
        timeSpent: 7200,
        status: 'completed',
        createdAt: new Date(),
        priority: 'high',
        estimatedTime: 14400
      },
      {
        id: '2',
        title: 'Implement responsive navigation',
        description: 'Add mobile-friendly navigation menu',
        project: 'portfolio',
        tags: ['frontend', 'responsive'],
        timeSpent: 3600,
        status: 'active',
        createdAt: new Date(),
        priority: 'medium',
        estimatedTime: 7200
      },
      {
        id: '3',
        title: 'Optimize portfolio images',
        description: 'Compress and optimize all portfolio images',
        project: 'portfolio',
        tags: ['optimization', 'images'],
        timeSpent: 1800,
        status: 'paused',
        createdAt: new Date(),
        priority: 'low',
        estimatedTime: 3600
      },
      
      // True North Insights tasks
      {
        id: '4',
        title: 'Build analytics dashboard',
        description: 'Create comprehensive data visualization dashboard',
        project: 'true-north-insights',
        tags: ['analytics', 'dashboard'],
        timeSpent: 14400,
        status: 'active',
        createdAt: new Date(),
        priority: 'high',
        estimatedTime: 28800
      },
      {
        id: '5',
        title: 'Implement data pipeline',
        description: 'Set up automated data collection and processing',
        project: 'true-north-insights',
        tags: ['backend', 'data'],
        timeSpent: 10800,
        status: 'completed',
        createdAt: new Date(),
        priority: 'high',
        estimatedTime: 14400
      },
      {
        id: '6',
        title: 'Add real-time notifications',
        description: 'Implement WebSocket-based alert system',
        project: 'true-north-insights',
        tags: ['realtime', 'notifications'],
        timeSpent: 5400,
        status: 'paused',
        createdAt: new Date(),
        priority: 'medium',
        estimatedTime: 7200
      },
      
      // Forge Board tasks
      {
        id: '7',
        title: 'Design kanban board interface',
        description: 'Create drag-and-drop task management interface',
        project: 'forge-board',
        tags: ['design', 'ui'],
        timeSpent: 9000,
        status: 'active',
        createdAt: new Date(),
        priority: 'high',
        estimatedTime: 14400
      },
      {
        id: '8',
        title: 'Implement team collaboration features',
        description: 'Add commenting and assignment functionality',
        project: 'forge-board',
        tags: ['collaboration', 'features'],
        timeSpent: 12600,
        status: 'completed',
        createdAt: new Date(),
        priority: 'medium',
        estimatedTime: 21600
      },
      
      // Time Forge tasks
      {
        id: '9',
        title: 'Setup project structure',
        description: 'Initialize the project with proper folder structure',
        project: 'time-forge',
        tags: ['setup', 'architecture'],
        timeSpent: 3600,
        status: 'completed',
        createdAt: new Date(),
        priority: 'high',
        estimatedTime: 7200
      },
      {
        id: '10',
        title: 'Implement user authentication',
        description: 'Add login and registration functionality',
        project: 'time-forge',
        tags: ['auth', 'security'],
        timeSpent: 7200,
        status: 'active',
        createdAt: new Date(),
        priority: 'high',
        estimatedTime: 14400
      },
      {
        id: '11',
        title: 'Design database schema',
        description: 'Plan and create the database structure',
        project: 'time-forge',
        tags: ['database', 'design'],
        timeSpent: 5400,
        status: 'paused',
        createdAt: new Date(),
        priority: 'medium',
        estimatedTime: 10800
      }
    ];
  }

  // Navigation methods
  navigateToReports() {
    this.currentView = 'reports';
  }

  navigateToHome() {
    this.currentView = 'home';
  }

  navigateToPlanning() {
    this.currentView = 'planning';
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
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.minSwipeDistance) {
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
    this.handleSwipeRight();
  }

  handleRightClick() {
    this.handleSwipeLeft();
  }

  // Mouse events for desktop navigation arrows
  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (window.innerWidth > 768) { // Only on desktop
      const windowWidth = window.innerWidth;
      const edgeThreshold = 100; // px from edge
      
      this.showLeftArrow = event.clientX < edgeThreshold && this.currentView !== 'reports';
      this.showRightArrow = event.clientX > (windowWidth - edgeThreshold) && this.currentView !== 'planning';
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
  }

  onTaskUpdate(task: Task) {
    const existingIndex = this.allTasks.findIndex(t => t.id === task.id);
    if (existingIndex >= 0) {
      this.allTasks[existingIndex] = task;
    } else {
      this.allTasks.push(task);
    }
  }

  onTaskDelete(taskId: string) {
    this.allTasks = this.allTasks.filter(task => task.id !== taskId);
  }

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
        day: 'numeric' 
      });
    } else {
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - days + 1);
      
      this.currentDateDisplay = `${startDate.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric' 
      })} - ${today.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric' 
      })}`;
    }
  }

  // Footer methods
  async pingServer() {
    const start = performance.now();
    try {
      const response = await fetch('/api/health');
      this.isConnected = response.status === 200;
      this.pingTime = Math.round(performance.now() - start);
    } catch {
      this.isConnected = false;
      this.pingTime = Math.round(performance.now() - start);
    }
  }
}
