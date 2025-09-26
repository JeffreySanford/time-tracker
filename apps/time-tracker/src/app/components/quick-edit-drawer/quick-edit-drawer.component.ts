import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TaskDto } from '../../services/task-api.service';

@Component({
  selector: 'app-quick-edit-drawer',
  templateUrl: './quick-edit-drawer.component.html',
  styleUrls: ['./quick-edit-drawer.component.scss'],
  standalone: false,
})
export class QuickEditDrawerComponent {
  @Input() task: TaskDto | null = null;
  @Output() saveTask = new EventEmitter<TaskDto>();
  @Output() cancelEdit = new EventEmitter<void>();

  onSave() {
    if (this.task) this.saveTask.emit(this.task);
  }

  onCancel() {
    this.cancelEdit.emit();
  }
}
