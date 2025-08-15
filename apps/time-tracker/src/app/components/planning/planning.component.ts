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
  priority?: 'low' | 'medium' | 'high';
  estimatedTime?: number; // in seconds
}

@Component({
  selector: 'app-planning',
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.scss'],
    // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false
})
export class PlanningComponent {
  @Input() projects: Project[] = [];
  @Input() allTasks: Task[] = [];
  @Input() selectedProject!: Project; // Will always be provided by parent
  @Output() projectChange = new EventEmitter<Project>();
  @Output() taskUpdate = new EventEmitter<Task>();
  @Output() taskDelete = new EventEmitter<string>();

  viewMode: 'kanban' | 'list' = 'kanban';
  showProjectSelector = false;
  showTaskForm = false;

  // New task form
  newTask: Partial<Task> = {
    title: '',
    description: '',
    tags: [],
    priority: 'medium',
    estimatedTime: 3600 // 1 hour default
  };

  get filteredTasks(): Task[] {
    return this.allTasks.filter(task => task.project === this.selectedProject.id);
  }

  get kanbanColumns() {
    return [
      {
        id: 'active',
        title: 'Active',
        tasks: this.filteredTasks.filter(task => task.status === 'active'),
        color: '#3b82f6'
      },
      {
        id: 'paused',
        title: 'Paused',
        tasks: this.filteredTasks.filter(task => task.status === 'paused'),
        color: '#f59e0b'
      },
      {
        id: 'completed',
        title: 'Completed',
        tasks: this.filteredTasks.filter(task => task.status === 'completed'),
        color: '#10b981'
      }
    ];
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
      estimatedTime: 3600
    };
  }

  createTask() {
    if (!this.newTask.title?.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      title: this.newTask.title,
      description: this.newTask.description || '',
      project: this.selectedProject.id,
      tags: this.newTask.tags || [],
      status: 'active',
      timeSpent: 0,
      createdAt: new Date(),
      priority: this.newTask.priority || 'medium',
      estimatedTime: this.newTask.estimatedTime || 3600
    };

    this.taskUpdate.emit(task);
    this.resetTaskForm();
    this.showTaskForm = false;
  }

  updateTaskStatus(task: Task, newStatus: 'active' | 'completed' | 'paused') {
    const updatedTask = { ...task, status: newStatus };
    this.taskUpdate.emit(updatedTask);
  }

  deleteTask(taskId: string) {
    this.taskDelete.emit(taskId);
  }

  onDragStart(event: DragEvent, task: Task) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', JSON.stringify(task));
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, status: string) {
    event.preventDefault();
    const taskData = event.dataTransfer?.getData('text/plain');
    if (taskData) {
      const task = JSON.parse(taskData) as Task;
      const newStatus = status as 'active' | 'completed' | 'paused';
      if (task.status !== newStatus) {
        this.updateTaskStatus(task, newStatus);
      }
    }
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

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  }

  getProjectColor(projectId: string): string {
    const project = this.projects.find(p => p.id === projectId);
    return project ? project.color ?? '#667eea' : '#667eea';
  }

  addTag(tagName: string) {
    if (tagName.trim() && !this.newTask.tags?.includes(tagName.trim())) {
      this.newTask.tags = [...(this.newTask.tags || []), tagName.trim()];
    }
  }

  removeTag(tagName: string) {
    this.newTask.tags = this.newTask.tags?.filter(tag => tag !== tagName) || [];
  }
}
