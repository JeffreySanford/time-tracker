import { Component, Input, Output, EventEmitter } from '@angular/core';

export type ViewType = 'reports' | 'home' | 'planning';

@Component({
  selector: 'app-system-status',
  templateUrl: './system-status.component.html',
  styleUrls: ['./system-status.component.scss'],
  standalone: false
})
export class SystemStatusComponent {
  @Input() currentView: ViewType = 'home';
  
  @Output() viewChange = new EventEmitter<ViewType>();
  
  navigateToReports() {
    this.viewChange.emit('reports');
  }

  navigateToHome() {
    this.viewChange.emit('home');
  }

  navigateToPlanning() {
    this.viewChange.emit('planning');
  }
}