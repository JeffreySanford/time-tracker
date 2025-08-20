import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TaskDto } from '../../services/task-api.service';

@Component({
  selector: 'app-quick-edit-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './quick-edit-drawer.component.html',
  styleUrls: ['./quick-edit-drawer.component.scss']
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
