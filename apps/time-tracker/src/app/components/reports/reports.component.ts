import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Project } from '../../models/project.model';

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
export class ReportsComponent {
  @Input() projects: Project[] = [];
  @Input() tasks: Task[] = [];
  @Input() selectedProject!: Project; // Will always be provided by parent
  @Output() projectChange = new EventEmitter<Project>();

  // Sample time entries for demonstration
  timeEntries: TimeEntry[] = [
    {
      id: '1',
      date: new Date(),
      project: 'time-forge',
      timeSpent: 7200, // 2 hours
      description: 'Implemented user authentication'
    },
    {
      id: '2',
      date: new Date(Date.now() - 86400000), // Yesterday
      project: 'time-forge',
      timeSpent: 5400, // 1.5 hours
      description: 'Database schema design'
    },
    {
      id: '3',
      date: new Date(Date.now() - 172800000), // 2 days ago
      project: 'portfolio',
      timeSpent: 10800, // 3 hours
      description: 'Portfolio landing page design'
    }
  ];

  reportPeriod = '7'; // 7 days
  showProjectSelector = false;

  get filteredTimeEntries(): TimeEntry[] {
    const days = parseInt(this.reportPeriod);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    let entries = this.timeEntries.filter(entry => entry.date >= cutoffDate);
    
    if (this.selectedProject.id) {
      entries = entries.filter(entry => entry.project === this.selectedProject.id);
    }
    
    return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
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
    // Period filter is automatically applied through the getter
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
}
