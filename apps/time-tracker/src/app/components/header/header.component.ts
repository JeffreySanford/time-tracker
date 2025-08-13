import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false
})
export class HeaderComponent {
  @Input() selectedRange = '1';
  @Input() currentDateDisplay = '';
  @Input() totalTimeDisplay = '0h 0m';
  @Input() unreadMessages = 0;
  @Input() showUserMenu = false;

  @Output() rangeChange = new EventEmitter<void>();
  @Output() userMenuToggle = new EventEmitter<void>();

  onRangeChange(): void {
    this.rangeChange.emit();
  }

  toggleUserMenu(): void {
    this.userMenuToggle.emit();
  }
}
